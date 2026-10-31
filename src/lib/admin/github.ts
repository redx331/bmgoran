import type { Product } from '../../data/products';

const API = 'https://api.github.com';

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
}

export interface SessionInfo {
  login: string;
  defaultBranch: string;
}

export interface CatalogueSnapshot {
  products: Product[];
  sha: string;
}

export type FileChange =
  | { path: string; content: string | Blob }
  | { path: string; delete: true };

export class GitHubError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

/** Accepts `owner/repo`, a github.com URL, or a `.git` clone URL. */
export function parseRepository(value: string): Repository | null {
  const cleaned = value
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
  const parts = cleaned.split('/');
  if (parts.length !== 2) return null;
  const owner = parts[0];
  const name = parts[1];
  if (!owner || !name) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name)) return null;
  return { owner, name, fullName: `${owner}/${name}` };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function textToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

function describeError(status: number, body: unknown): string {
  if (status === 401) return 'Jeton invalide ou expiré. Créez un nouveau jeton GitHub.';
  if (status === 403) {
    return 'Accès refusé. Vérifiez que le jeton autorise « Contents: Read and write » sur ce dépôt.';
  }
  if (status === 404) {
    return 'Dépôt ou fichier introuvable. Vérifiez le nom du dépôt et les droits du jeton.';
  }
  if (status === 409 || status === 422) {
    return 'Le dépôt a changé entre-temps. Rechargez le catalogue puis réessayez.';
  }
  const message =
    body && typeof body === 'object' && 'message' in body
      ? String((body as { message: unknown }).message)
      : '';
  return message ? `GitHub : ${message}` : `Erreur GitHub (${status}).`;
}

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new GitHubError(
      'Impossible de joindre GitHub. Vérifiez votre connexion internet puis réessayez.',
    );
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new GitHubError(describeError(response.status, body), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Verifies the token and that it can push to the configured repository. */
export async function verifyAccess(token: string, repository: string): Promise<SessionInfo> {
  const repo = parseRepository(repository);
  if (!repo) {
    throw new GitHubError(
      'Dépôt mal configuré. Utilisez le format « propriétaire/dépôt » dans site.config.json.',
    );
  }

  const user = await request<{ login: string }>(token, '/user');
  const details = await request<{
    default_branch: string;
    permissions?: { push?: boolean };
  }>(token, `/repos/${repo.fullName}`);

  if (details.permissions?.push === false) {
    throw new GitHubError(
      'Ce jeton ne peut pas modifier ce dépôt. Autorisez « Contents: Read and write ».',
      403,
    );
  }

  return { login: user.login, defaultBranch: details.default_branch };
}

export async function loadCatalogue(
  token: string,
  repository: string,
  branch: string,
): Promise<CatalogueSnapshot> {
  const repo = parseRepository(repository);
  if (!repo) throw new GitHubError('Dépôt mal configuré.');

  const file = await request<{ content: string; sha: string; encoding: string }>(
    token,
    `/repos/${repo.fullName}/contents/src/data/products.json?ref=${encodeURIComponent(branch)}`,
  );

  let products: Product[];
  try {
    products = JSON.parse(decodeBase64Utf8(file.content)) as Product[];
  } catch {
    throw new GitHubError(
      'Le fichier src/data/products.json est illisible. Corrigez-le sur GitHub avant de continuer.',
    );
  }
  if (!Array.isArray(products)) {
    throw new GitHubError('src/data/products.json ne contient pas une liste de produits.');
  }

  return { products, sha: file.sha };
}

/**
 * Commits several files in ONE commit (Git Data API), so a save with photos
 * triggers a single Cloudflare rebuild instead of one per file.
 */
export async function commitChanges(
  token: string,
  repository: string,
  branch: string,
  message: string,
  changes: FileChange[],
): Promise<{ commitSha: string; htmlUrl: string }> {
  const repo = parseRepository(repository);
  if (!repo) throw new GitHubError('Dépôt mal configuré.');
  if (changes.length === 0) throw new GitHubError('Aucune modification à enregistrer.');

  const ref = await request<{ object: { sha: string } }>(
    token,
    `/repos/${repo.fullName}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  const parentSha = ref.object.sha;
  const parent = await request<{ tree: { sha: string } }>(
    token,
    `/repos/${repo.fullName}/git/commits/${parentSha}`,
  );

  const tree: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string | null;
  }> = [];

  for (const change of changes) {
    if ('delete' in change) {
      tree.push({ path: change.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const content =
      typeof change.content === 'string'
        ? textToBase64(change.content)
        : await blobToBase64(change.content);
    const blob = await request<{ sha: string }>(token, `/repos/${repo.fullName}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content, encoding: 'base64' }),
    });
    tree.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await request<{ sha: string }>(token, `/repos/${repo.fullName}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
  });

  const commit = await request<{ sha: string; html_url: string }>(
    token,
    `/repos/${repo.fullName}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [parentSha],
      }),
    },
  );

  await request(token, `/repos/${repo.fullName}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return { commitSha: commit.sha, htmlUrl: commit.html_url };
}
