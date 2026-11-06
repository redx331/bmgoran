#!/usr/bin/env node
/**
 * Downloads the shop's real Yalidine delivery fees, departing from Oran, for every wilaya.
 *
 *   node scripts/yalidine-fees.mjs
 *
 * Asks for the Yalidine API ID and token (never saved; the screen is cleared after) and writes only the
 * fees to .tmp/yalidine-fees.json. Uses the "Fees" endpoint of api.yalidine.app.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const FROM = 31; // Oran
const LAST_WILAYA = 69;

// Visible input: hidden typing confused the owner on Windows. The keys are never saved.
const prompt = createInterface({ input: process.stdin, output: process.stdout });
const apiId = (await prompt.question('Yalidine API ID : ')).trim();
const apiToken = (await prompt.question('Yalidine API token : ')).trim();
prompt.close();
console.clear();
if (!apiId || !apiToken) {
  console.error('API ID et token requis. Rien n’a été téléchargé.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

async function fees(to) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://api.yalidine.app/v1/fees/?from_wilaya_id=${FROM}&to_wilaya_id=${to}`, {
      headers: { 'X-API-ID': apiId, 'X-API-TOKEN': apiToken },
    });
    if (response.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (response.status === 401 || response.status === 403) {
      console.error('Yalidine refuse ces identifiants. Vérifiez l’API ID et le token.');
      process.exit(1);
    }
    if (!response.ok) return { error: `HTTP ${response.status}` };
    return response.json();
  }
  return { error: 'rate limited' };
}

const min = (values) => {
  const numbers = values.filter((v) => typeof v === 'number');
  return numbers.length ? Math.min(...numbers) : null;
};

const result = {};
for (let to = 1; to <= LAST_WILAYA; to++) {
  const data = await fees(to);
  const code = String(to).padStart(2, '0');
  if (data.error || !data.per_commune) {
    result[code] = { error: data.error ?? 'no data' };
  } else {
    const communes = Object.values(data.per_commune);
    // The seat commune carries the wilaya's name; fall back to the cheapest commune.
    const seat = communes.find((c) => plain(c.commune_name) === plain(data.to_wilaya_name));
    result[code] = {
      name: data.to_wilaya_name,
      seat: seat?.commune_name ?? null,
      home: seat?.express_home ?? min(communes.map((c) => c.express_home)),
      desk: seat?.express_desk ?? min(communes.map((c) => c.express_desk)),
      homeMin: min(communes.map((c) => c.express_home)),
      homeMax: Math.max(0, ...communes.map((c) => c.express_home ?? 0)) || null,
      deskMin: min(communes.map((c) => c.express_desk)),
      retour: data.retour_fee,
    };
  }
  console.log(code, result[code].name ?? '', result[code].home ?? result[code].error, result[code].desk ?? '');
  await sleep(400);
}

mkdirSync('.tmp', { recursive: true });
writeFileSync('.tmp/yalidine-fees.json', JSON.stringify(result, null, 2));
console.log('Terminé : .tmp/yalidine-fees.json');
