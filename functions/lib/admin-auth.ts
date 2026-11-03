/**
 * ADMIN PASSWORD + SESSION HELPERS
 * ================================
 *
 * The admin panel used to ask for a GitHub token in the browser. It now asks
 * for a username and password; the GitHub token stays on the server (Cloudflare
 * environment variables) and is never sent to the browser.
 *
 * Credentials:
 *   ADMIN_USERNAME       plain username, compared in constant time
 *   ADMIN_PASSWORD_HASH  "pbkdf2-sha256$<iterations>$<saltB64>$<hashB64>"
 *                        generated with `node scripts/hash-admin-password.mjs`
 *   ADMIN_SESSION_SECRET random secret used to sign session cookies
 *
 * The session is a signed, HttpOnly cookie valid for 8 hours. It contains only
 * the username and an expiry, never the password or the GitHub token.
 */

export const SESSION_COOKIE = 'bmg_admin';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

export interface AdminEnv {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
}

interface LoginAttempt {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

const encoder = new TextEncoder();

export function isAdminConfigured(env: AdminEnv): boolean {
  return Boolean(
    env.ADMIN_USERNAME &&
      env.ADMIN_PASSWORD_HASH &&
      env.ADMIN_SESSION_SECRET &&
      env.ADMIN_SESSION_SECRET.length >= 32,
  );
}

/* ------------------------------------------------------------------ base64 */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return base64ToBytes(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

/* --------------------------------------------------------------- password */

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const saltCopy = new Uint8Array(salt.length);
  saltCopy.set(salt);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltCopy, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Builds a storable hash. Exposed so the Node script and tests share one format. */
export async function hashAdminPassword(
  password: string,
  options: { salt?: Uint8Array; iterations?: number } = {},
): Promise<string> {
  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const iterations = options.iterations ?? 100_000;
  const hash = await derivePasswordHash(password, salt, iterations);
  return `pbkdf2-sha256$${iterations}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

function timingSafeBytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}

export function timingSafeTextEqual(left: string, right: string): boolean {
  return timingSafeBytesEqual(encoder.encode(left), encoder.encode(right));
}

/** Checks a password against the stored `pbkdf2-sha256$…` value. */
export async function verifyAdminPassword(
  password: string,
  stored: string | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 1_000_000) return false;

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = base64ToBytes(parts[2]!);
    expected = base64ToBytes(parts[3]!);
  } catch {
    return false;
  }

  const actual = await derivePasswordHash(password, salt, iterations);
  return timingSafeBytesEqual(actual, expected);
}

/* ---------------------------------------------------------------- session */

async function hmac(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

export interface AdminSession {
  username: string;
  expiresAt: number;
}

export async function createAdminSession(
  username: string,
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const session: AdminSession = {
    username,
    expiresAt: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = bytesToBase64Url(await hmac(secret, payload));
  return `${payload}.${signature}`;
}

export async function readAdminSession(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<AdminSession | null> {
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let expected: Uint8Array;
  let received: Uint8Array;
  try {
    expected = await hmac(secret, payload);
    received = base64UrlToBytes(signature);
  } catch {
    return null;
  }
  if (!timingSafeBytesEqual(expected, received)) return null;

  let session: AdminSession;
  try {
    session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as AdminSession;
  } catch {
    return null;
  }

  if (
    typeof session.username !== 'string' ||
    typeof session.expiresAt !== 'number' ||
    session.expiresAt * 1000 <= now
  ) {
    return null;
  }
  return session;
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('Cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return undefined;
}

export function sessionCookie(token: string, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

export function clearSessionCookie(secure: boolean): string {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

/** Session cookies get `Secure` only over HTTPS, so local `wrangler pages dev` works. */
export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

/** Rejects cross-site form posts. Same-origin calls from the admin panel pass. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

/* --------------------------------------------------------- login attempts */

export function loginRateLimited(key: string, now: number = Date.now()): boolean {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;
  if (attempt.resetAt <= now) {
    loginAttempts.delete(key);
    return false;
  }
  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

export function recordLoginFailure(key: string, now: number = Date.now()): void {
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  attempt.count += 1;
}

export function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}

/** Test helper: forget every in-memory attempt counter. */
export function resetLoginAttempts(): void {
  loginAttempts.clear();
}
