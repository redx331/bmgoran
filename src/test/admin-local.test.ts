import { beforeEach, describe, expect, it } from 'vitest';
import { PRODUCTS, type Product } from '../data/products';
import {
  clearLocalData,
  deleteLocalImage,
  loadLocalImages,
  loadLocalProducts,
  putLocalImage,
  saveLocalProducts,
} from '../lib/admin/local';

const KEY = 'bmg.admin.local.products';
const SAMPLE: Product[] = [{ ...PRODUCTS[0]!, price: 4321 }];

beforeEach(() => {
  window.localStorage.clear();
});

describe('local catalogue storage', () => {
  it('returns the fallback when nothing is saved', () => {
    const result = loadLocalProducts(PRODUCTS);

    expect(result.restored).toBe(false);
    expect(result.products).toBe(PRODUCTS);
  });

  it('round-trips products with a version and timestamp', () => {
    expect(saveLocalProducts(SAMPLE)).toBe(true);

    const raw = JSON.parse(window.localStorage.getItem(KEY)!) as {
      version: number;
      savedAt: string;
    };
    expect(raw.version).toBe(1);
    expect(Number.isNaN(Date.parse(raw.savedAt))).toBe(false);

    const result = loadLocalProducts(PRODUCTS);
    expect(result.restored).toBe(true);
    expect(result.savedAt).toBe(raw.savedAt);
    expect(result.products).toEqual(SAMPLE);
  });

  it('discards corrupt or outdated saved data', () => {
    window.localStorage.setItem(KEY, '{"version":2,"products":[]}');

    expect(loadLocalProducts(PRODUCTS).restored).toBe(false);
    expect(window.localStorage.getItem(KEY)).toBeNull();

    window.localStorage.setItem(KEY, 'not json');
    expect(loadLocalProducts(PRODUCTS).restored).toBe(false);
  });

  it('rejects payloads containing invalid products', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        products: [{ id: 'p-999' }],
      }),
    );

    expect(loadLocalProducts(PRODUCTS).restored).toBe(false);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('clears the saved catalogue', async () => {
    saveLocalProducts(SAMPLE);

    await clearLocalData();

    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});

describe('local image storage without IndexedDB', () => {
  it('falls back gracefully when IndexedDB is unavailable', async () => {
    expect(typeof indexedDB).toBe('undefined');

    await expect(putLocalImage('/images/products/x.jpg', new Blob(['x']))).resolves.toBe(false);
    await expect(deleteLocalImage('/images/products/x.jpg')).resolves.toBe(false);
    await expect(loadLocalImages(['/images/products/x.jpg'])).resolves.toEqual(new Map());
  });
});
