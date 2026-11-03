import { clearSessionCookie, isSameOrigin, isSecureRequest } from '../../lib/admin-auth';

/** Clears the admin session cookie. */
export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  if (!isSameOrigin(request)) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': clearSessionCookie(isSecureRequest(request)),
    },
  });
}
