#!/usr/bin/env node
/**
 * Generates the admin password hash and a session secret.
 *
 *   node scripts/hash-admin-password.mjs "mon-mot-de-passe"
 *   node scripts/hash-admin-password.mjs "mon-mot-de-passe" 50000
 *
 * Paste the printed lines into Cloudflare Pages → Settings → Environment
 * variables (Production), or into `.dev.vars` for local testing.
 * Never commit the real values.
 */
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const [password, iterationsArg] = process.argv.slice(2);

if (!password) {
  console.error('Usage: node scripts/hash-admin-password.mjs "mot-de-passe" [iterations]');
  process.exit(1);
}

const iterations = Number(iterationsArg ?? 100_000);
if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > 1_000_000) {
  console.error('Iterations must be an integer between 10000 and 1000000.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');

console.log(`ADMIN_PASSWORD_HASH=pbkdf2-sha256$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}`);
console.log('');
console.log('Keep these values secret. They give access to the catalogue and its GitHub token.');
console.log('Cloudflare Pages → Settings → Environment variables → Production.');
console.log('Local testing: put them in `.dev.vars` (already gitignored).');

// Self-check: the generated hash must verify.
const check = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
if (!timingSafeEqual(hash, check)) {
  console.error('Hash self-check failed.');
  process.exit(1);
}
