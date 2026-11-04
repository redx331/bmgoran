import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../data/categories';
import realProducts from '../data/products.json';
import { PRODUCTS, searchProducts, getProductBySlug, isOrderable } from '../data/products';

const PUBLIC_DIR = join(process.cwd(), 'public');

describe('product catalogue integrity', () => {
  it('contains at least one product', () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
  });

  it('uses unique ids, slugs and part numbers', () => {
    const ids = PRODUCTS.map((product) => product.id);
    const slugs = PRODUCTS.map((product) => product.slug);
    const partNumbers = PRODUCTS.flatMap((product) =>
      product.partNumber ? [product.partNumber] : [],
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(partNumbers).size).toBe(partNumbers.length);
  });

  it('uses URL-safe product slugs', () => {
    for (const product of PRODUCTS) {
      expect(product.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('has complete French and Arabic copy for every product', () => {
    for (const product of PRODUCTS) {
      expect(product.nameFr.trim(), `${product.slug} nameFr`).not.toBe('');
      expect(product.nameAr.trim(), `${product.slug} nameAr`).not.toBe('');
      expect(product.descriptionFr.trim(), `${product.slug} descriptionFr`).not.toBe('');
      expect(product.descriptionAr.trim(), `${product.slug} descriptionAr`).not.toBe('');
      expect(product.specifications.length, `${product.slug} specifications`).toBeGreaterThan(0);

      for (const spec of product.specifications) {
        expect(spec.labelFr.trim()).not.toBe('');
        expect(spec.labelAr.trim()).not.toBe('');
        expect(spec.valueFr.trim()).not.toBe('');
        expect(spec.valueAr.trim()).not.toBe('');
      }
    }
  });

  it('uses a valid category and a positive whole-dinar price', () => {
    const categoryIds = new Set(CATEGORIES.map((category) => category.id));
    for (const product of PRODUCTS) {
      expect(categoryIds.has(product.category), `${product.slug} category`).toBe(true);
      expect(Number.isInteger(product.price), `${product.slug} price`).toBe(true);
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it('finds every image of the real catalogue on disk', () => {
    for (const product of realProducts) {
      for (const image of product.images) {
        expect(image.startsWith('/images/'), `${product.slug} image path`).toBe(true);
        expect(existsSync(join(PUBLIC_DIR, image)), `${product.slug} missing ${image}`).toBe(true);
      }
    }
  });

  it('never claims unverified compatibility and never fabricates vehicles', () => {
    for (const product of PRODUCTS) {
      if (product.compatibility?.verified) {
        expect(
          product.compatibility.vehicles.length,
          `${product.slug} claims verified compatibility without vehicles`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('marks demo products explicitly so they cannot pass as verified data', () => {
    // The shipped catalogue is entirely demo data.
    for (const product of PRODUCTS) {
      expect(product.isDemo, `${product.slug} must be flagged as demo`).toBe(true);
    }
  });

  it('keeps at least one product unavailable for checkout testing', () => {
    expect(PRODUCTS.some((product) => !isOrderable(product))).toBe(true);
  });

  it('finds products by name, accent-insensitive text and part number', () => {
    expect(searchProducts('phares led').map((product) => product.slug)).toContain('led-headlights');
    expect(searchProducts('DEMO-BP-104').map((product) => product.slug)).toEqual([
      'front-brake-pads',
    ]);
    expect(searchProducts('telephone').map((product) => product.slug)).toContain(
      'motorcycle-phone-holder',
    );
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProductBySlug('does-not-exist')).toBeUndefined();
  });
});
