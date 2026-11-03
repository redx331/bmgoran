import { describe, expect, it } from 'vitest';
import {
  clearLoginFailures,
  clearSessionCookie,
  createAdminSession,
  hashAdminPassword,
  isAdminConfigured,
  loginRateLimited,
  readAdminSession,
  recordLoginFailure,
  resetLoginAttempts,
  sessionCookie,
  timingSafeTextEqual,
  verifyAdminPassword,
} from '../../functions/lib/admin-auth';

const SECRET = 'a'.repeat(48);
const ITERATIONS = 1_000;

describe('admin password hashing', () => {
  it('round-trips a password', async () => {
    const stored = await hashAdminPassword('mot-de-passe-solide', { iterations: ITERATIONS });
    expect(stored.startsWith(`pbkdf2-sha256$${ITERATIONS}$`)).toBe(true);
    await expect(verifyAdminPassword('mot-de-passe-solide', stored)).resolves.toBe(true);
    await expect(verifyAdminPassword('mot-de-passe-solide!', stored)).resolves.toBe(false);
  });

  it('rejects malformed or missing hashes instead of throwing', async () => {
    await expect(verifyAdminPassword('x', undefined)).resolves.toBe(false);
    await expect(verifyAdminPassword('x', 'plain-text')).resolves.toBe(false);
    await expect(verifyAdminPassword('x', 'pbkdf2-sha256$0$aaa$bbb')).resolves.toBe(false);
    await expect(verifyAdminPassword('x', 'pbkdf2-sha256$1000$!!!$bbb')).resolves.toBe(false);
  });

  it('compares usernames without early exit', () => {
    expect(timingSafeTextEqual('bmg', 'bmg')).toBe(true);
    expect(timingSafeTextEqual('bmg', 'bmh')).toBe(false);
    expect(timingSafeTextEqual('bmg', 'bmg-longer')).toBe(false);
  });
});

describe('admin session token', () => {
  it('round-trips the username and expiry', async () => {
    const token = await createAdminSession('bmg', SECRET);
    const session = await readAdminSession(token, SECRET);
    expect(session?.username).toBe('bmg');
    expect(session!.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects a tampered token, a wrong secret and an expired token', async () => {
    const token = await createAdminSession('bmg', SECRET);
    const [payload, signature] = token.split('.');
    await expect(readAdminSession(`${payload}.${signature}x`, SECRET)).resolves.toBeNull();
    await expect(readAdminSession(token, `${SECRET}x`)).resolves.toBeNull();
    await expect(readAdminSession(token, SECRET, Date.now() + 9 * 60 * 60 * 1000)).resolves.toBeNull();
    await expect(readAdminSession(undefined, SECRET)).resolves.toBeNull();
  });

  it('sets HttpOnly, Strict and Secure cookies only over HTTPS', () => {
    expect(sessionCookie('token', true)).toContain('HttpOnly');
    expect(sessionCookie('token', true)).toContain('SameSite=Strict');
    expect(sessionCookie('token', true)).toContain('Secure');
    expect(sessionCookie('token', false)).not.toContain('Secure');
    expect(clearSessionCookie(false)).toContain('Max-Age=0');
  });

  it('requires every secret before enabling the admin', () => {
    expect(isAdminConfigured({})).toBe(false);
    expect(
      isAdminConfigured({
        ADMIN_USERNAME: 'bmg',
        ADMIN_PASSWORD_HASH: 'pbkdf2-sha256$1000$aa$bb',
        ADMIN_SESSION_SECRET: 'too-short',
      }),
    ).toBe(false);
    expect(
      isAdminConfigured({
        ADMIN_USERNAME: 'bmg',
        ADMIN_PASSWORD_HASH: 'pbkdf2-sha256$1000$aa$bb',
        ADMIN_SESSION_SECRET: SECRET,
      }),
    ).toBe(true);
  });
});

describe('login throttling', () => {
  it('locks an address after five failures and clears on success', () => {
    resetLoginAttempts();
    const key = '203.0.113.9';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(loginRateLimited(key)).toBe(false);
      recordLoginFailure(key);
    }
    expect(loginRateLimited(key)).toBe(true);
    clearLoginFailures(key);
    expect(loginRateLimited(key)).toBe(false);
  });
});
