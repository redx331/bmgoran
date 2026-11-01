import type { Product } from '../../data/products';

const PRODUCTS_KEY = 'bmg.admin.local.products';
const DB_NAME = 'bmg-admin';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';

interface StoredCatalogue {
  version: 1;
  savedAt: string;
  products: Product[];
}

export interface LocalCatalogueResult {
  products: Product[];
  restored: boolean;
  savedAt?: string;
}

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<Product>;
  return (
    typeof product.id === 'string' &&
    typeof product.slug === 'string' &&
    typeof product.nameFr === 'string' &&
    typeof product.nameAr === 'string' &&
    typeof product.price === 'number' &&
    Array.isArray(product.images)
  );
}

/** Reads the catalogue saved by the local admin sandbox, or returns the fallback. */
export function loadLocalProducts(fallback: Product[]): LocalCatalogueResult {
  if (!hasWindow()) return { products: fallback, restored: false };
  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return { products: fallback, restored: false };

    const parsed = JSON.parse(raw) as Partial<StoredCatalogue> | null;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.products) ||
      !parsed.products.every(isProduct)
    ) {
      window.localStorage.removeItem(PRODUCTS_KEY);
      return { products: fallback, restored: false };
    }

    return {
      products: parsed.products,
      restored: true,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : undefined,
    };
  } catch {
    return { products: fallback, restored: false };
  }
}

/** Persists the catalogue in localStorage. Returns false if storage is unavailable/full. */
export function saveLocalProducts(products: Product[]): boolean {
  if (!hasWindow()) return false;
  try {
    const payload: StoredCatalogue = {
      version: 1,
      savedAt: new Date().toISOString(),
      products,
    };
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function finish(
  database: IDBDatabase,
  transaction: IDBTransaction,
  resolve: (value: boolean) => void,
  success: boolean,
): void {
  transaction.oncomplete = () => {
    database.close();
    resolve(success);
  };
  transaction.onerror = () => {
    database.close();
    resolve(false);
  };
  transaction.onabort = () => {
    database.close();
    resolve(false);
  };
}

/** Stores an uploaded photo blob under its future repository path. */
export async function putLocalImage(path: string, blob: Blob): Promise<boolean> {
  const database = await openDatabase();
  if (!database) return false;

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(IMAGE_STORE, 'readwrite');
      transaction.objectStore(IMAGE_STORE).put(blob, path);
      finish(database, transaction, resolve, true);
    } catch {
      database.close();
      resolve(false);
    }
  });
}

export async function deleteLocalImage(path: string): Promise<boolean> {
  const database = await openDatabase();
  if (!database) return false;

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(IMAGE_STORE, 'readwrite');
      transaction.objectStore(IMAGE_STORE).delete(path);
      finish(database, transaction, resolve, true);
    } catch {
      database.close();
      resolve(false);
    }
  });
}

/** Loads saved photo blobs for the given paths. Missing/unavailable storage yields an empty map. */
export async function loadLocalImages(paths: string[]): Promise<Map<string, Blob>> {
  const database = await openDatabase();
  if (!database || paths.length === 0) {
    database?.close();
    return new Map();
  }

  return new Promise((resolve) => {
    const found = new Map<string, Blob>();
    try {
      const transaction = database.transaction(IMAGE_STORE, 'readonly');
      const store = transaction.objectStore(IMAGE_STORE);
      for (const path of paths) {
        const request = store.get(path);
        request.onsuccess = () => {
          if (request.result instanceof Blob) found.set(path, request.result);
        };
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(found);
      };
      transaction.onerror = () => {
        database.close();
        resolve(found);
      };
      transaction.onabort = () => {
        database.close();
        resolve(found);
      };
    } catch {
      database.close();
      resolve(found);
    }
  });
}

/** Removes the saved catalogue and every saved photo. */
export async function clearLocalData(): Promise<void> {
  if (hasWindow()) {
    try {
      window.localStorage.removeItem(PRODUCTS_KEY);
    } catch {
      // Ignore.
    }
  }

  const database = await openDatabase();
  if (!database) return;

  await new Promise<void>((resolve) => {
    try {
      const transaction = database.transaction(IMAGE_STORE, 'readwrite');
      transaction.objectStore(IMAGE_STORE).clear();
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        resolve();
      };
      transaction.onabort = () => {
        database.close();
        resolve();
      };
    } catch {
      database.close();
      resolve();
    }
  });
}
