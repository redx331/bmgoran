#!/usr/bin/env node
/**
 * Changes the production admin password without showing it anywhere.
 *
 *   node scripts/change-admin-password.mjs
 *
 * Asks for the new password (hidden), then uploads a fresh hash and session
 * secret to Cloudflare, which also logs out every open session. Requires
 * `wrangler login`. The change applies on the next deployment.
 */
import { spawnSync } from 'node:child_process';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';

const PROJECT = 'bmg-oran';
const ITERATIONS = 100_000;
const MIN_LENGTH = 12;

// A silent output stream keeps the typed password off the screen.
const silent = new Writable({ write: (_chunk, _encoding, done) => done() });
const prompt = createInterface({ input: process.stdin, output: silent, terminal: true });
const lines = prompt[Symbol.asyncIterator]();

async function ask(label) {
  process.stdout.write(label);
  const { value = '' } = await lines.next();
  process.stdout.write('\n');
  return value;
}

const password = await ask('Nouveau mot de passe : ');
const confirmation = await ask('Confirmez le mot de passe : ');
prompt.close();

if (password !== confirmation) {
  console.error('Les mots de passe ne correspondent pas. Rien n’a été modifié.');
  process.exit(1);
}
if (password.length < MIN_LENGTH) {
  console.error(`Il faut au moins ${MIN_LENGTH} caractères. Rien n’a été modifié.`);
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const secrets = {
  ADMIN_PASSWORD_HASH: `pbkdf2-sha256$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`,
  ADMIN_SESSION_SECRET: randomBytes(32).toString('hex'),
};

for (const [name, value] of Object.entries(secrets)) {
  // The value only travels through stdin, never the command line.
  const result = spawnSync('npx', ['--yes', 'wrangler@4', 'pages', 'secret', 'put', name, '--project-name', PROJECT], {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`Échec pour ${name}. Relancez cette commande : l’ancien mot de passe peut rester actif.`);
    process.exit(1);
  }
}

console.log('Mot de passe enregistré. Il sera actif après le prochain déploiement.');
