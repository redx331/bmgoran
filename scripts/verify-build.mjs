/**
 * Checks the production build for the things that most often break on a static
 * storefront: missing product pages, broken SEO tags, missing images, bad
 * redirects. Run `npm run build && npm run verify`.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const errors = [];
const warnings = [];

const products = JSON.parse(readFileSync(join(root, 'src', 'data', 'products.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
const redirects = readFileSync(join(dist, '_redirects'), 'utf8');
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');

const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(products.length > 0, 'No products found in src/data/products.json');
check(redirects.includes('/* /index.html 200'), 'SPA fallback missing from dist/_redirects');

for (const product of products) {
  const pagePath = join(dist, 'product', product.slug, 'index.html');
  check(existsSync(pagePath), `Missing static page: product/${product.slug}/index.html`);
  if (!existsSync(pagePath)) continue;

  const html = readFileSync(pagePath, 'utf8');
  check(
    html.includes(`<meta property="og:image" content="${site.siteUrl.replace(/\/+$/, '')}/og/${product.slug}.png"`),
    `og:image missing or wrong in product/${product.slug}`,
  );
  check(
    html.includes(`<link rel="canonical" href="${site.siteUrl.replace(/\/+$/, '')}/product/${product.slug}"`),
    `canonical missing in product/${product.slug}`,
  );
  check(html.includes(product.nameAr), `Product name missing from static page: ${product.slug}`);
  check(
    redirects.includes(`/product/${product.slug} /product/${product.slug}/index.html 200`),
    `Redirect missing for /product/${product.slug}`,
  );
  check(
    sitemap.includes(`${site.siteUrl.replace(/\/+$/, '')}/product/${product.slug}<`),
    `Sitemap missing /product/${product.slug}`,
  );

  for (const image of product.images) {
    if (image.startsWith('/')) {
      check(existsSync(join(dist, image)), `Product image missing from dist: ${image}`);
    }
  }
  check(
    existsSync(join(dist, 'og', `${product.slug}.png`)),
    `Open Graph image missing: og/${product.slug}.png (run npm run og)`,
  );
}

const assetRefs = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
check(assetRefs.length > 0, 'No hashed Vite assets referenced by index.html');
for (const asset of new Set(assetRefs)) {
  check(existsSync(join(dist, asset)), `Referenced asset missing: ${asset}`);
}

const sizeKb = statSync(join(dist, 'index.html')).size / 1024;
if (sizeKb > 100) warnings.push(`index.html is ${sizeKb.toFixed(1)} KB (large for a shell)`);

if (site.siteUrl.includes('YOUR-PROJECT')) {
  warnings.push('site.config.json still contains the placeholder siteUrl (canonical/OG URLs).');
}
if (site.businessName === 'AutoParts DZ') {
  warnings.push('Business name is still the demo brand "AutoParts DZ".');
}
if (site.demoContact !== false) {
  warnings.push('Contact details are still marked as demo (demoContact: true).');
}
if (products.every((product) => product.isDemo)) {
  warnings.push('All products are marked as demo. Replace them before launch.');
}
const shippingConfig = readFileSync(join(root, 'src', 'config', 'shipping.ts'), 'utf8');
if (/SHIPPING_RATES_ARE_EXAMPLES\s*=\s*true/.test(shippingConfig)) {
  warnings.push('Delivery rates are still examples (SHIPPING_RATES_ARE_EXAMPLES = true).');
}

console.log(`Checked ${products.length} products, ${products.length + 1} OG images, and the SPA fallback.`);
if (warnings.length) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`  ⚠ ${warning}`);
}
if (errors.length) {
  console.error('\nBuild verification FAILED:');
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}
console.log('\n✓ Build structure looks correct.');
