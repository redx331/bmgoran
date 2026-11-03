import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost as githubPost } from '../../functions/api/admin/github';
import { onRequestPost as loginPost } from '../../functions/api/admin/login';
import { onRequestPost as logoutPost } from '../../functions/api/admin/logout';
import { onRequestGet as sessionGet } from '../../functions/api/admin/session';
import {
  createAdminSession,
  hashAdminPassword,
  resetLoginAttempts,
  type AdminEnv,
} from '../../functions/lib/admin-auth';
import type { AdminFunctionEnv } from '../../functions/lib/admin-http';
import { textToBase64 } from '../../src/lib/admin/github';

const ORIGIN = 'https://shop.example.test';
const URL_LOGIN = `${ORIGIN}/api/admin/login`;
const URL_SESSION = `${ORIGIN}/api/admin/session`;
const URL_LOGOUT = `${ORIGIN}/api/admin/logout`;
const URL_GITHUB = `${ORIGIN}/api/admin/github`;
const USERNAME = 'bmg';
const PASSWORD = 'mot-de-passe-test';
const SECRET = 's'.repeat(48);

let env: AdminFunctionEnv;
let hash: string;

beforeEach(async () => {
  resetLoginAttempts();
  hash = await hashAdminPassword(PASSWORD, { iterations: 1_000 });
  env = {
    ADMIN_USERNAME: USERNAME,
    ADMIN_PASSWORD_HASH: hash,
    ADMIN_SESSION_SECRET: SECRET,
    GITHUB_TOKEN: 'server-token',
    GITHUB_REPOSITORY: 'redx331/bmgoran',
    GITHUB_BRANCH: 'main',
  };
});

function loginRequest(body: unknown, ua = '203.0.113.5'): Request {
  return new Request(URL_LOGIN, {
    method: 'POST',
    headers: { Origin: ORIGIN, 'CF-Connecting-IP': ua },
    body: JSON.stringify(body),
  });
}

async function cookieFor(username = USERNAME): Promise<string> {
  const token = await createAdminSession(username, SECRET);
  return `bmg_admin=${token}`;
}

function adminRequest(url: string, cookie: string, body?: unknown, method = 'POST'): Request {
  return new Request(url, {
    method,
    headers: {
      Origin: ORIGIN,
      Cookie: cookie,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('POST /api/admin/login', () => {
  it('sets an HttpOnly session cookie for valid credentials', async () => {
    const response = await loginPost({ request: loginRequest({ username: USERNAME, password: PASSWORD }), env });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ login: USERNAME });
    const cookie = response.headers.get('Set-Cookie') ?? '';
    expect(cookie).toContain('bmg_admin=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).not.toContain(PASSWORD);
  });

  it('rejects a wrong password or unknown user without revealing which one', async () => {
    const wrongPassword = await loginPost({
      request: loginRequest({ username: USERNAME, password: 'nope' }),
      env,
    });
    const wrongUser = await loginPost({
      request: loginRequest({ username: 'someone', password: PASSWORD }),
      env,
    });

    expect(wrongPassword.status).toBe(401);
    expect(wrongUser.status).toBe(401);
    await expect(wrongPassword.json()).resolves.toEqual({ error: 'invalid-credentials' });
    await expect(wrongUser.json()).resolves.toEqual({ error: 'invalid-credentials' });
  });

  it('locks the address after five failures', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await loginPost({
        request: loginRequest({ username: USERNAME, password: 'nope' }),
        env,
      });
      expect(response.status).toBe(401);
    }
    const blocked = await loginPost({
      request: loginRequest({ username: USERNAME, password: PASSWORD }),
      env,
    });
    expect(blocked.status).toBe(429);
  });

  it('is unavailable until the server secrets are configured', async () => {
    const response = await loginPost({
      request: loginRequest({ username: USERNAME, password: PASSWORD }),
      env: {} as AdminEnv,
    });
    expect(response.status).toBe(503);
  });

  it('refuses a cross-site post', async () => {
    const request = new Request(URL_LOGIN, {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    expect((await loginPost({ request, env })).status).toBe(403);
  });
});

describe('/api/admin/session', () => {
  it('returns the signed-in user and repository config', async () => {
    const request = adminRequest(URL_SESSION, await cookieFor(), undefined, 'GET');
    const response = await sessionGet({ request, env });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      login: USERNAME,
      repository: 'redx331/bmgoran',
      branch: 'main',
      githubConfigured: true,
    });
  });

  it('returns 401 without a valid cookie', async () => {
    const request = adminRequest(URL_SESSION, 'bmg_admin=forged', undefined, 'GET');
    expect((await sessionGet({ request, env })).status).toBe(401);
  });
});

describe('POST /api/admin/logout', () => {
  it('clears the cookie', async () => {
    const response = await logoutPost({ request: adminRequest(URL_LOGOUT, await cookieFor()) });
    expect(response.status).toBe(204);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
});

describe('POST /api/admin/github', () => {
  it('rejects anonymous calls before touching GitHub', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = adminRequest(URL_GITHUB, 'bmg_admin=forged', { action: 'catalogue' });
    expect((await githubPost({ request, env })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the catalogue without exposing the server token', async () => {
    const products = [{ slug: 'phares-led', nameFr: 'Phares LED' }];
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(String(input));
        expect((init?.headers as Record<string, string>).Authorization).toBe(
          'Bearer server-token',
        );
        return Response.json({
          content: textToBase64(JSON.stringify(products)),
          sha: 'file-sha',
          encoding: 'base64',
        });
      }),
    );

    const request = adminRequest(URL_GITHUB, await cookieFor(), { action: 'catalogue' });
    const response = await githubPost({ request, env });
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toEqual({ products, sha: 'file-sha' });
    expect(text).not.toContain('server-token');
    expect(calls[0]).toContain('/repos/redx331/bmgoran/contents/src/data/products.json');
    vi.unstubAllGlobals();
  });

  it('rejects path traversal and unknown files', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = adminRequest(URL_GITHUB, await cookieFor(), {
      action: 'commit',
      message: 'test',
      changes: [{ path: '../../secrets.txt', content: 'YQ==' }],
    });
    const response = await githubPost({ request, env });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid-changes' });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('reports a missing GitHub token instead of failing silently', async () => {
    const request = adminRequest(URL_GITHUB, await cookieFor(), { action: 'catalogue' });
    const response = await githubPost({ request, env: { ...env, GITHUB_TOKEN: '' } });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'github-not-configured' });
  });
});
