import { GitHubError, bytesToBase64, type CatalogueSnapshot, type FileChange } from './github';

const BASE = '/api/admin';

export interface AdminSession {
  login: string;
  repository: string;
  branch: string;
  githubConfigured: boolean;
  canWrite: boolean;
}

interface ErrorBody {
  error?: string;
  message?: string;
}

function messageFor(status: number, body: ErrorBody | null): string {
  if (body?.message) return body.message;
  if (body?.error === 'github-not-configured') {
    return 'Le jeton GitHub du serveur n’est pas configuré (GITHUB_TOKEN).';
  }
  if (status === 401) return 'Session expirée. Reconnectez-vous.';
  if (status === 403) return 'Accès refusé.';
  if (status === 413) return 'Le fichier envoyé est trop volumineux.';
  if (status === 429) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (status === 503) return 'L’administration n’est pas configurée sur le serveur.';
  return 'Une erreur est survenue. Réessayez.';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new GitHubError('Impossible de joindre le serveur. Vérifiez votre connexion.', 0);
  }

  if (!response.ok) {
    let body: ErrorBody | null = null;
    try {
      body = (await response.json()) as ErrorBody;
    } catch {
      body = null;
    }
    throw new GitHubError(messageFor(response.status, body), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function contentToBase64(content: string | Blob): Promise<string> {
  const bytes =
    typeof content === 'string'
      ? new TextEncoder().encode(content)
      : new Uint8Array(await content.arrayBuffer());
  return bytesToBase64(bytes);
}

/** Returns the current session, or throws a 401 GitHubError. */
export async function getSession(): Promise<AdminSession> {
  return request<AdminSession>('/session');
}

export async function login(username: string, password: string): Promise<AdminSession> {
  await request<{ login: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return getSession();
}

export async function logout(): Promise<void> {
  await request<void>('/logout', { method: 'POST' });
}

/** Reads `src/data/products.json` through the server (token never reaches the browser). */
export async function loadCatalogue(): Promise<CatalogueSnapshot> {
  return request<CatalogueSnapshot>('/github', {
    method: 'POST',
    body: JSON.stringify({ action: 'catalogue' }),
  });
}

/** Commits several files in one commit through the server. */
export async function commitChanges(
  message: string,
  changes: FileChange[],
): Promise<{ commitSha: string; htmlUrl: string }> {
  const payload = await Promise.all(
    changes.map(async (change) => {
      if ('delete' in change) return { path: change.path, delete: true as const };
      return { path: change.path, content: await contentToBase64(change.content) };
    }),
  );

  return request<{ commitSha: string; htmlUrl: string }>('/github', {
    method: 'POST',
    body: JSON.stringify({ action: 'commit', message, changes: payload }),
  });
}
