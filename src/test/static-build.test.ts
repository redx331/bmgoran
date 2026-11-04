import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import siteConfig from '../../site.config.json';
import realProducts from '../data/products.json';
import type { Product } from '../data/products';

// The build uses the real catalogue, unlike the other tests.
const PRODUCTS = realProducts as unknown as Product[];

const DIST = join(process.cwd(), 'dist');
const BUILT = existsSync(join(DIST, 'index.html'));
const baseUrl = siteConfig.siteUrl.replace(/\/+$/, '');

/**
 * These assertions inspect the real production output. Run `npm run build`
 * before `npm test` (the documented verification order) to execute them.
 */
describe.skipIf(!BUILT)('production build output', () => {
  it('creates a static entry point for every product deep link', () => {
    for (const product of PRODUCTS) {
      const file = join(DIST, 'product', product.slug, 'index.html');
      expect(existsSync(file), `missing static page for ${product.slug}`).toBe(true);

      const html = readFileSync(file, 'utf8');
      expect(html).toContain(`<title>`);
      expect(html).toContain(product.nameFr);
      expect(html).toContain(`content="${baseUrl}/product/${product.slug}"`);
      expect(html).toContain(`href="${baseUrl}/product/${product.slug}"`);
      expect(html).toContain(`content="${baseUrl}/og/${product.slug}.png"`);
      expect(html).toContain('<meta property="og:type" content="product"');
      expect(html).toContain('<meta name="robots" content="index, follow"');
      expect(html).toMatch(/<html lang="fr" dir="ltr">/);
      expect(html).toContain(`href="${product.images[0]}"`);
    }
  });

  it('writes descriptions that stop on a word boundary', () => {
    for (const product of PRODUCTS) {
      const html = readFileSync(join(DIST, 'product', product.slug, 'index.html'), 'utf8');
      const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
      expect(description.length, `${product.slug} description`).toBeGreaterThan(40);
      expect(description).toContain('Livraison en Algérie');
      expect(description).not.toMatch(/\s$/);
      // No truncated fragment glued to the suffix.
      expect(description).not.toMatch(/[a-zà-ÿ]{1,3} Livraison en Algérie/);
    }
  });

  it('rewrites product URLs before the SPA fallback', () => {
    const redirects = readFileSync(join(DIST, '_redirects'), 'utf8');
    const fallbackIndex = redirects.indexOf('/* /index.html 200');
    expect(fallbackIndex).toBeGreaterThan(0);

    for (const product of PRODUCTS) {
      const line = `/product/${product.slug} /product/${product.slug}/index.html 200`;
      expect(redirects).toContain(line);
      expect(redirects.indexOf(line)).toBeLessThan(fallbackIndex);
      expect(redirects).toContain(`/product/${product.slug}/ /product/${product.slug}/index.html 200`);
    }
  });

  it('lists every page in the sitemap and keeps checkout out of search', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    for (const path of ['/', '/shop', '/delivery', '/contact']) {
      expect(sitemap).toContain(`<loc>${baseUrl}${path}</loc>`);
    }
    for (const product of PRODUCTS) {
      expect(sitemap).toContain(`<loc>${baseUrl}/product/${product.slug}</loc>`);
    }
    expect(sitemap).not.toContain('/checkout/');

    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('Disallow: /checkout/');
    expect(robots).toContain(`Sitemap: ${baseUrl}/sitemap.xml`);
  });

  it('references only built assets and ships every product image', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
    expect(assets.length).toBeGreaterThan(0);
    for (const asset of new Set(assets)) {
      expect(existsSync(join(DIST, asset as string)), `missing ${asset}`).toBe(true);
    }

    for (const product of PRODUCTS) {
      for (const image of product.images) {
        expect(existsSync(join(DIST, image)), `missing built image ${image}`).toBe(true);
      }
      expect(existsSync(join(DIST, 'og', `${product.slug}.png`))).toBe(true);
    }
  });

  it('keeps the Cloudflare security headers and SPA fallback', () => {
    expect(existsSync(join(DIST, '_headers'))).toBe(true);
    const headers = readFileSync(join(DIST, '_headers'), 'utf8');
    expect(headers).toContain('Content-Security-Policy');
    expect(headers).toContain('X-Content-Type-Options');
  });
});

describe.skipIf(BUILT)('production build output', () => {
  it('is skipped until `npm run build` has been run', () => {
    expect(BUILT).toBe(false);
  });
});
