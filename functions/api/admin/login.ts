import {
  clearLoginFailures,
  createAdminSession,
  isAdminConfigured,
  isSameOrigin,
  isSecureRequest,
  loginRateLimited,
  recordLoginFailure,
  sessionCookie,
  timingSafeTextEqual,
  verifyAdminPassword,
} from '../../lib/admin-auth';
import { json, type AdminFunctionEnv } from '../../lib/admin-http';

const MAX_BODY_LENGTH = 4096;

function clientKey(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'local'
  );
}

/**
 * Exchanges the admin username + password for a signed session cookie.
 * The GitHub token never leaves the server.
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

  const key = clientKey(request);
  if (loginRateLimited(key)) {
    return json(429, { error: 'too-many-attempts' });
  }

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

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password || username.length > 64 || password.length > 256) {
    recordLoginFailure(key);
    return json(401, { error: 'invalid-credentials' });
  }

  // Verify the password even when the username is wrong, so both failures
  // take the same time (no username enumeration).
  const passwordOk = await verifyAdminPassword(password, env.ADMIN_PASSWORD_HASH);
  const usernameOk = timingSafeTextEqual(username, env.ADMIN_USERNAME!);

  if (!usernameOk || !passwordOk) {
    recordLoginFailure(key);
    return json(401, { error: 'invalid-credentials' });
  }

  clearLoginFailures(key);
  const token = await createAdminSession(username, env.ADMIN_SESSION_SECRET!);
  return json(
    200,
    { login: username },
    { 'Set-Cookie': sessionCookie(token, isSecureRequest(request)) },
  );
}
