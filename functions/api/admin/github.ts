import {
  GitHubError,
  commitChanges,
  loadCatalogue,
  type FileChange,
} from '../../../src/lib/admin/github';
import { isAdminConfigured, isSameOrigin } from '../../lib/admin-auth';
import {
  currentSession,
  githubConfig,
  json,
  type AdminFunctionEnv,
} from '../../lib/admin-http';

const MAX_BODY_LENGTH = 25 * 1024 * 1024;
const MAX_CHANGES = 40;
const MAX_CONTENT_LENGTH = 12 * 1024 * 1024;

interface ChangePayload {
  path?: unknown;
  content?: unknown;
  delete?: unknown;
}

function isSafePath(path: string): boolean {
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) return false;
  if (path === 'src/data/products.json') return true;
  return /^public\/(images\/products|og)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(path);
}

function parseChanges(value: unknown): FileChange[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CHANGES) return null;

  const changes: FileChange[] = [];
  for (const item of value as ChangePayload[]) {
    if (typeof item !== 'object' || item === null) return null;
    const path = typeof item.path === 'string' ? item.path : '';
    if (!isSafePath(path)) return null;

    if (item.delete === true) {
      changes.push({ path, delete: true });
      continue;
    }

    const content = typeof item.content === 'string' ? item.content : '';
    if (!content || content.length > MAX_CONTENT_LENGTH) return null;

    let bytes: Uint8Array;
    try {
      const binary = atob(content);
      bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
      return null;
    }
    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    changes.push({ path, content: new Blob([buffer]) });
  }
  return changes;
}

function githubFailure(error: unknown): Response {
  if (!(error instanceof GitHubError)) {
    return json(502, { error: 'github', message: 'GitHub est injoignable. Réessayez.' });
  }

  if (error.status === 401) {
    return json(502, {
      error: 'github-auth',
      message: 'Le jeton GitHub du serveur est invalide ou expiré.',
    });
  }
  if (error.status === 403) {
    return json(502, {
      error: 'github-auth',
      message: 'Le jeton GitHub du serveur n’a pas le droit de modifier ce dépôt.',
    });
  }
  if (error.status === 404) {
    return json(502, {
      error: 'github-auth',
      message: 'Dépôt GitHub introuvable. Vérifiez GITHUB_REPOSITORY sur le serveur.',
    });
  }
  if (error.status === 409 || error.status === 422) {
    return json(409, {
      error: 'conflict',
      message: 'Le dépôt a changé entre-temps. Rechargez le catalogue puis réessayez.',
    });
  }
  return json(502, { error: 'github', message: error.message });
}

/**
 * Server-side GitHub proxy. The browser session cookie is checked here; the
 * GitHub token is read from the environment and never returned.
 *
 * POST { action: 'catalogue' }
 * POST { action: 'commit', message, changes: [{ path, content(base64) } | { path, delete: true }] }
 */
export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: AdminFunctionEnv;
}): Promise<Response> {
  if (!isSameOrigin(request)) return json(403, { error: 'forbidden' });
  if (!isAdminConfigured(env)) return json(503, { error: 'not-configured' });

  const session = await currentSession(request, env);
  if (!session) return json(401, { error: 'unauthorized' });

  const config = githubConfig(env);
  if (!config.token) return json(503, { error: 'github-not-configured' });

  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) return json(413, { error: 'too-large' });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('Not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: 'invalid-json' });
  }

  try {
    if (body.action === 'catalogue') {
      const snapshot = await loadCatalogue(config.token, config.repository, config.branch);
      return json(200, { products: snapshot.products, sha: snapshot.sha });
    }

    if (body.action === 'commit') {
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 200) : '';
      if (!message) return json(400, { error: 'invalid-message' });

      const changes = parseChanges(body.changes);
      if (!changes) return json(400, { error: 'invalid-changes' });

      const result = await commitChanges(
        config.token,
        config.repository,
        config.branch,
        message,
        changes,
      );
      return json(200, result);
    }

    return json(400, { error: 'unknown-action' });
  } catch (error) {
    return githubFailure(error);
  }
}
