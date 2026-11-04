import { isAdminConfigured, isSameOrigin } from '../../lib/admin-auth';
import { currentSession, githubConfig, json, type AdminFunctionEnv } from '../../lib/admin-http';
import { checkWriteAccess } from '../../../src/lib/admin/github';

/** Returns the signed-in username, or 401 when the cookie is missing/expired. */
export async function onRequestGet({
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
  let canWrite = false;
  if (config.token) {
    try {
      canWrite = await checkWriteAccess(config.token, config.repository);
    } catch {
      // GitHub unreachable: keep the session, but do not claim write access.
      canWrite = false;
    }
  }

  return json(200, {
    login: session.username,
    repository: config.repository,
    branch: config.branch,
    githubConfigured: Boolean(config.token),
    canWrite,
  });
}
