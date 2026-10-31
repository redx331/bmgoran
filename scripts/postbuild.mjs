/**
 * Post-build step:
 *  1. Generates a static HTML entry point for EVERY product so deep links get
 *     correct Open Graph metadata even if a crawler does not run JavaScript.
 *  2. Generates Cloudflare Pages `_redirects` (per-product rewrite + SPA fallback).
 *  3. Generates sitemap.xml and robots.txt from the configured site URL.
 *  4. Applies the deployed site URL / business name to the base index.html.
 *
 * Runs automatically via `npm run build`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const products = JSON.parse(readFileSync(join(root, 'src', 'data', 'products.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const baseUrl = site.siteUrl.replace(/\/+$/, '');
const baseHtml = readFileSync(indexPath, 'utf8');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const formatPrice = (amount) => `${priceFormatter.format(amount)} DA`;

/** Truncates prose at a word boundary instead of cutting mid-word. */
function truncateAtWord(text, maxLength) {
  if (text.length <= maxLength) return text.trim();
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function setMeta(html, attribute, key, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`);
  if (pattern.test(html)) {
    return html.replace(pattern, `<meta ${attribute}="${key}" content="${escaped}" />`);
  }
  return html.replace('</head>', `    <meta ${attribute}="${key}" content="${escaped}" />\n  </head>`);
}

function setCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/;
  if (pattern.test(html)) {
    return html.replace(pattern, `<link rel="canonical" href="${escapeHtml(href)}" />`);
  }
  return html.replace('</head>', `    <link rel="canonical" href="${escapeHtml(href)}" />\n  </head>`);
}

function productHtml(product, template) {
  const url = `${baseUrl}/product/${product.slug}`;
  const title = `${product.nameFr} — ${formatPrice(product.price)} | ${site.businessName}`;
  const description = `${truncateAtWord(product.descriptionFr, 160).replace(/[.,;:!?]$/, '')}. Livraison en Algérie, commande via WhatsApp.`;
  const image = `${baseUrl}/og/${product.slug}.png`;
  let html = template;
  html = setTitle(html, title);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:type', 'product');
  html = setMeta(html, 'property', 'og:site_name', site.businessName);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:width', '1200');
  html = setMeta(html, 'property', 'og:image:height', '630');
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:locale', 'fr_DZ');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'robots', 'index, follow');
  html = setCanonical(html, url);
  html = html.replace(/<html\s+lang="[^"]*"\s+dir="[^"]*">/, '<html lang="fr" dir="ltr">');

  if (product.images[0]?.startsWith('/')) {
    html = html.replace(
      '</head>',
      `    <link rel="preload" as="image" href="${escapeHtml(product.images[0])}" />\n  </head>`,
    );
  }
  return html;
}

// 1. Base page: apply configured URL and business name.
const homeTitle = `${site.businessName} — Pièces auto & moto en Algérie`;
let indexHtml = baseHtml
  .replaceAll('https://YOUR-PROJECT.pages.dev', baseUrl)
  .replaceAll('AutoParts DZ', site.businessName);
indexHtml = setTitle(indexHtml, homeTitle);
indexHtml = setMeta(indexHtml, 'property', 'og:site_name', site.businessName);
indexHtml = setMeta(indexHtml, 'property', 'og:title', homeTitle);
indexHtml = setMeta(indexHtml, 'name', 'twitter:title', homeTitle);
writeFileSync(indexPath, indexHtml, 'utf8');

// 2. Static product entry points.
for (const product of products) {
  const dir = join(dist, 'product', product.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), productHtml(product, indexHtml), 'utf8');
}

// 3. Cloudflare Pages redirects. Product rewrites MUST come before the SPA catch-all.
const redirectLines = [
  '# Generated by scripts/postbuild.mjs — do not edit inside dist/.',
  '# Static product pages keep their own OG/meta tags on direct links.',
  ...products.flatMap((product) => [
    `/product/${product.slug} /product/${product.slug}/index.html 200`,
    `/product/${product.slug}/ /product/${product.slug}/index.html 200`,
  ]),
  '',
  '# Client-side routes fall back to the app shell.',
  '/* /index.html 200',
  '',
];
writeFileSync(join(dist, '_redirects'), redirectLines.join('\n'), 'utf8');

// 4. Sitemap + robots.
const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/shop', priority: '0.9', changefreq: 'weekly' },
  { path: '/delivery', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  ...products.map((product) => ({
    path: `/product/${product.slug}`,
    priority: '0.9',
    changefreq: 'weekly',
  })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${escapeHtml(baseUrl + page.path)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /checkout/\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
  'utf8',
);

console.log(`✓ ${products.length} static product pages with Open Graph metadata`);
console.log('✓ _redirects (deep links + SPA fallback)');
console.log('✓ sitemap.xml + robots.txt');
if (baseUrl.includes('YOUR-PROJECT')) {
  console.log('\n⚠ site.config.json still uses the placeholder siteUrl. Update it before launch.');
}
