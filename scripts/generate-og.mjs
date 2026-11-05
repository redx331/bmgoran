/**
 * Generates 1200×630 Open Graph images for every product (and a default one).
 *
 * Uses locally installed Chrome/Edge in headless mode — no paid service and no
 * npm dependency. Run: npm run og
 *
 * Re-run this after changing a product name/price/image, then commit
 * public/og/*.png. If Chrome is not found, set CHROME_PATH to the executable.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const products = JSON.parse(readFileSync(join(root, 'src', 'data', 'products.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const outDir = join(root, 'public', 'og');
const tmpDir = join(root, '.tmp', 'og');
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) {
  console.error('Chrome/Edge not found. Set CHROME_PATH and run npm run og again.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

function html({ title, subtitle, price, priceNote = 'Prix en dinars algériens · DZD', image, demo, brand, domain }) {
  const imageUrl = pathToFileURL(join(root, 'public', image)).href;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    background: #0b0c0e;
    color: #f5f6f7;
    font-family: "Segoe UI", Arial, sans-serif;
    position: relative;
  }
  .frame { position: absolute; inset: 0; border: 1px solid #262a30; }
  .grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: linear-gradient(90deg, #000, transparent 72%);
  }
  .accent { position: absolute; top: 0; left: 0; width: 100%; height: 7px; background: #e10600; }
  .content { position: absolute; left: 68px; top: 60px; width: 640px; bottom: 56px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .mark { width: 46px; height: 46px; background: #e10600; display: grid; place-items: center; font-weight: 800; font-size: 17px; letter-spacing: 1px; }
  .brand-name { font-size: 20px; font-weight: 700; letter-spacing: .1px; }
  .brand-tag { font-size: 11px; color: #9aa1aa; letter-spacing: 2.6px; text-transform: uppercase; margin-top: 2px; }
  .eyebrow { margin-top: 64px; color: #ff4a43; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
  h1 { margin-top: 14px; font-size: 55px; line-height: 1.04; letter-spacing: -1.8px; font-weight: 800; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .subtitle { margin-top: 14px; color: #a7aeb7; font-size: 18px; line-height: 1.45; max-width: 560px; }
  .bottom { margin-top: auto; display: flex; align-items: center; gap: 18px; }
  .price { font-size: 39px; font-weight: 800; letter-spacing: -1.2px; }
  .price-note { color: #858d97; font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; margin-top: 3px; }
  .demo { margin-left: auto; padding: 8px 12px; border: 1px solid rgba(255,138,134,.4); background: rgba(225,6,0,.12); color: #ffb4b0; font-size: 10px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; }
  .domain { position: absolute; left: 68px; bottom: 24px; color: #626a74; font-size: 12px; letter-spacing: .6px; }
  .visual { position: absolute; top: 0; right: 0; width: 480px; height: 630px; overflow: hidden; background: #111317; }
  .visual img { width: 100%; height: 100%; object-fit: cover; }
  .visual::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, #0b0c0e 0%, rgba(11,12,14,.15) 38%, transparent 70%); }
  .activity { position: absolute; right: 32px; bottom: 28px; z-index: 2; font-size: 10px; color: rgba(255,255,255,.5); letter-spacing: 2px; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="frame"></div>
  <div class="grid"></div>
  <div class="accent"></div>
  <div class="content">
    <div class="brand">
      <div class="mark">${escapeHtml(brand.mark)}</div>
      <div>
        <div class="brand-name">${escapeHtml(brand.name)}</div>
        <div class="brand-tag">${escapeHtml(brand.tag)}</div>
      </div>
    </div>
    <div class="eyebrow">${escapeHtml(title.eyebrow)}</div>
    <h1>${escapeHtml(title.value)}</h1>
    <div class="subtitle">${escapeHtml(subtitle)}</div>
    <div class="bottom">
      <div>
        <div class="price">${escapeHtml(price)}</div>
        <div class="price-note">${escapeHtml(priceNote)}</div>
      </div>
      ${demo ? '<div class="demo">Produit de démonstration</div>' : ''}
    </div>
  </div>
  <div class="visual"><img src="${imageUrl}" alt=""></div>
  <div class="activity">Pièces auto &amp; moto · 69 wilayas</div>
  <div class="domain">${escapeHtml(domain)}</div>
</body>
</html>`;
}

function screenshot(htmlContent, outFile) {
  const htmlFile = join(tmpDir, `${outFile.replaceAll('.png', '')}.html`);
  writeFileSync(htmlFile, htmlContent, 'utf8');
  execFileSync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=2500',
      `--user-data-dir=${join(tmpDir, 'chrome-profile')}`,
      `--screenshot=${join(outDir, outFile)}`,
      pathToFileURL(htmlFile).href,
    ],
    { stdio: 'ignore' },
  );
  console.log(`✓ ${outFile}`);
}

const domain = site.siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
const brand = { mark: site.brandMark, name: site.businessName, tag: 'Pièces auto & moto · Algérie' };

screenshot(
  html({
    title: { eyebrow: 'Commande en ligne · 69 wilayas', value: 'La bonne pièce, livrée partout en Algérie.' },
    subtitle:
      'Pièces et accessoires pour voitures et motos. Prix, photos, disponibilité et livraison affichés avant la commande.',
    price: '69 wilayas',
    priceNote: 'Livraison à domicile ou au bureau',
    image: '/images/products/led-headlights-1.svg',
    demo: false,
    brand,
    domain,
  }),
  'default.png',
);

for (const product of products) {
  screenshot(
    html({
      title: { eyebrow: `${product.category.replaceAll('-', ' ')} · 69 WILAYAS`, value: product.nameFr },
      subtitle: product.descriptionFr.slice(0, 150).trim() + (product.descriptionFr.length > 150 ? '…' : ''),
      price: `${priceFormatter.format(product.price)} DA`,
      image: product.images[0] ?? '/images/products/placeholder.svg',
      demo: product.isDemo,
      brand,
      domain,
    }),
    `${product.slug}.png`,
  );
}

rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nOpen Graph images written to public/og (${products.length + 1} files).`);
