import rawProducts from './products.json';
import type { Locale } from '../lib/locale';

export type { Locale };

export type CategoryId =
  | 'car-parts'
  | 'motorcycle-parts'
  | 'universal-accessories'
  | 'vehicle-specific-parts';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface CompatibilityVehicle {
  make: string;
  model: string;
  years: string;
}

export interface Compatibility {
  /** Set to true ONLY after the fitment has been checked against the real vehicle. */
  verified: boolean;
  vehicles: CompatibilityVehicle[];
  noteFr?: string;
  noteAr?: string;
}

export interface Specification {
  labelFr: string;
  labelAr: string;
  valueFr: string;
  valueAr: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameFr: string;
  nameAr: string;
  category: CategoryId;
  price: number;
  images: string[];
  description: string;
  descriptionFr: string;
  descriptionAr: string;
  specifications: Specification[];
  partNumber?: string;
  brand?: string;
  compatibility?: Compatibility;
  stockStatus: StockStatus;
  featured: boolean;
  isDemo: boolean;
  keywords?: string[];
}

/**
 * Product catalogue.
 *
 * The data lives in `products.json` so that it can be edited without touching
 * any UI code (and so the static-page build script can read it too).
 * See `docs/PRODUCTS.md` for the field reference and image instructions.
 */
export const PRODUCTS: Product[] = rawProducts as Product[];

export function getProductBySlug(slug: string, list: Product[] = PRODUCTS): Product | undefined {
  return list.find((product) => product.slug === slug);
}

export function getProductName(product: Product, locale: Locale): string {
  return locale === 'ar' ? product.nameAr : product.nameFr || product.name;
}

export function getProductDescription(product: Product, locale: Locale): string {
  return locale === 'ar' ? product.descriptionAr : product.descriptionFr || product.description;
}

export function isOrderable(product: Product): boolean {
  return product.stockStatus !== 'out_of_stock';
}

/** Lowercase + remove accents and Arabic diacritics so search is forgiving. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchProducts(query: string, list: Product[] = PRODUCTS): Product[] {
  const needle = normalizeSearch(query);
  if (!needle) return list;
  return list.filter((product) => {
    const haystack = normalizeSearch(
      [
        product.name,
        product.nameFr,
        product.nameAr,
        product.partNumber ?? '',
        product.brand ?? '',
        ...(product.keywords ?? []),
      ].join(' '),
    );
    return haystack.includes(needle);
  });
}

export function filterByCategory(list: Product[], category: CategoryId | 'all'): Product[] {
  if (category === 'all') return list;
  return list.filter((product) => product.category === category);
}

export function relatedProducts(product: Product, limit = 3): Product[] {
  const sameCategory = PRODUCTS.filter(
    (candidate) => candidate.slug !== product.slug && candidate.category === product.category,
  );
  const others = PRODUCTS.filter(
    (candidate) => candidate.slug !== product.slug && candidate.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}
