import { SITE } from '../../src/config/business';
import {
  SESSION_COOKIE,
  isAdminConfigured,
  readAdminSession,
  readCookie,
  type AdminEnv,
  type AdminSession,
} from './admin-auth';

export interface AdminFunctionEnv extends AdminEnv {
  GITHUB_TOKEN?: string;
  GITHUB_REPOSITORY?: string;
  GITHUB_BRANCH?: string;
}

export function json(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export function githubConfig(env: AdminFunctionEnv): {
  repository: string;
  branch: string;
  token: string;
} {
  return {
    repository: (env.GITHUB_REPOSITORY || SITE.repository).trim(),
    branch: (env.GITHUB_BRANCH || SITE.branch || 'main').trim(),
    token: (env.GITHUB_TOKEN || '').trim(),
  };
}

export async function currentSession(
  request: Request,
  env: AdminFunctionEnv,
): Promise<AdminSession | null> {
  if (!isAdminConfigured(env)) return null;
  return readAdminSession(readCookie(request, SESSION_COOKIE), env.ADMIN_SESSION_SECRET!);
}
