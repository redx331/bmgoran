import { CATEGORIES } from '../../data/categories';
import type { CategoryId, Product, Specification, StockStatus } from '../../data/products';

export const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'in_stock', label: 'En stock' },
  { value: 'low_stock', label: 'Stock limité' },
  { value: 'out_of_stock', label: 'Rupture de stock' },
];

export type ProductErrors = Partial<Record<string, string>>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** URL-safe slug from a French product name. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** Appends -2, -3… until the slug is free. `ignoreSlug` allows keeping the current slug. */
export function uniqueSlug(
  base: string,
  products: Product[],
  ignoreSlug?: string | null,
): string {
  const root = slugify(base) || 'produit';
  const taken = new Set(
    products.filter((product) => product.slug !== ignoreSlug).map((product) => product.slug),
  );
  if (!taken.has(root)) return root;
  let index = 2;
  while (taken.has(`${root}-${index}`)) index += 1;
  return `${root}-${index}`;
}

export function nextProductId(products: Product[]): string {
  const highest = products.reduce((max, product) => {
    const match = /^p-(\d+)$/.exec(product.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `p-${String(highest + 1).padStart(3, '0')}`;
}

export function createEmptyProduct(products: Product[]): Product {
  return {
    id: nextProductId(products),
    slug: uniqueSlug('nouveau-produit', products),
    name: '',
    nameFr: '',
    nameAr: '',
    category: 'car-parts',
    price: 0,
    images: [],
    description: '',
    descriptionFr: '',
    descriptionAr: '',
    specifications: [],
    stockStatus: 'in_stock',
    featured: false,
    isDemo: true,
    compatibility: {
      verified: false,
      vehicles: [],
      noteFr:
        'Compatibilité non vérifiée. Confirmez la marque, le modèle et l’année du véhicule avant de commander.',
      noteAr: 'التوافق غير مؤكد. أكّد ماركة السيارة وطرازها وسنتها قبل الطلب.',
    },
  };
}

/** Next free `slug-N.jpg` name for a product, considering saved and pending images. */
export function nextImagePath(
  slug: string,
  images: string[],
  pendingPaths: string[] = [],
): string {
  const pattern = new RegExp(`^/images/products/${slug}-(\\d+)\\.(?:jpe?g|png|webp|svg)$`, 'i');
  const highest = [...images, ...pendingPaths].reduce((max, image) => {
    const match = pattern.exec(image);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `/images/products/${slug}-${highest + 1}.jpg`;
}

function clean(value: string): string {
  return value.trim();
}

/** Trims text, removes empty spec rows and empty optional fields before saving. */
export function prepareProduct(product: Product): Product {
  const nameFr = clean(product.nameFr);
  const specifications = product.specifications
    .map((spec) => ({
      labelFr: clean(spec.labelFr),
      labelAr: clean(spec.labelAr),
      valueFr: clean(spec.valueFr),
      valueAr: clean(spec.valueAr),
    }))
    .filter((spec) => spec.labelFr || spec.labelAr || spec.valueFr || spec.valueAr);

  const keywords = Array.from(
    new Set((product.keywords ?? []).map((keyword) => clean(keyword)).filter(Boolean)),
  ).slice(0, 20);

  const prepared: Product = {
    ...product,
    name: nameFr,
    nameFr,
    nameAr: clean(product.nameAr),
    slug: slugify(product.slug),
    descriptionFr: clean(product.descriptionFr),
    descriptionAr: clean(product.descriptionAr),
    description: clean(product.descriptionFr),
    specifications,
    images: Array.from(new Set(product.images)),
    partNumber: product.partNumber?.trim() || undefined,
    brand: product.brand?.trim() || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
  };

  return prepared;
}

export function validateProduct(
  product: Product,
  products: Product[],
  originalSlug?: string | null,
): ProductErrors {
  const errors: ProductErrors = {};
  const nameFr = clean(product.nameFr);
  const nameAr = clean(product.nameAr);

  if (nameFr.length < 2) errors.nameFr = 'Indiquez le nom français (2 caractères minimum).';
  if (nameAr.length < 2) errors.nameAr = 'Indiquez le nom arabe (2 caractères minimum).';

  if (!SLUG_PATTERN.test(product.slug)) {
    errors.slug = 'Utilisez uniquement a–z, 0–9 et des tirets (ex. phares-led-h4).';
  } else if (
    products.some((item) => item.slug === product.slug && item.slug !== originalSlug)
  ) {
    errors.slug = 'Cette adresse est déjà utilisée par un autre produit.';
  }

  if (!CATEGORIES.some((category) => category.id === product.category)) {
    errors.category = 'Choisissez une catégorie.';
  }

  if (!Number.isInteger(product.price) || product.price <= 0) {
    errors.price = 'Indiquez un prix entier en dinars, supérieur à 0.';
  } else if (product.price > 10_000_000) {
    errors.price = 'Ce prix semble trop élevé (maximum 10 000 000 DA).';
  }

  if (clean(product.descriptionFr).length < 10) {
    errors.descriptionFr = 'Ajoutez une description française (10 caractères minimum).';
  }
  if (clean(product.descriptionAr).length < 10) {
    errors.descriptionAr = 'Ajoutez une description arabe (10 caractères minimum).';
  }

  if (!STOCK_OPTIONS.some((option) => option.value === product.stockStatus)) {
    errors.stockStatus = 'Choisissez un état de stock.';
  }

  product.specifications.forEach((spec, index) => {
    const fields = [spec.labelFr, spec.labelAr, spec.valueFr, spec.valueAr].map(clean);
    const empty = fields.every((field) => !field);
    if (empty) return;
    if (fields.some((field) => !field)) {
      errors.specifications = `Caractéristique ${index + 1} : remplissez les quatre colonnes.`;
    }
  });

  if ((product.partNumber ?? '').length > 60) {
    errors.partNumber = 'La référence est trop longue (60 caractères maximum).';
  }
  if ((product.brand ?? '').length > 60) {
    errors.brand = 'La marque est trop longue (60 caractères maximum).';
  }

  return errors;
}

/** Replaces the product identified by `originalSlug`, or appends a new one. */
export function upsertProduct(
  products: Product[],
  product: Product,
  originalSlug: string | null,
): Product[] {
  if (!originalSlug) return [...products, product];
  return products.map((item) => (item.slug === originalSlug ? product : item));
}

export function removeProduct(products: Product[], slug: string): Product[] {
  return products.filter((product) => product.slug !== slug);
}

export function productsToJson(products: Product[]): string {
  return `${JSON.stringify(products, null, 2)}\n`;
}

export function productPath(slug: string): string {
  return `/product/${encodeURIComponent(slug)}`;
}

export function parseKeywords(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  );
}

export function formatKeywords(product: Product): string {
  return (product.keywords ?? []).join(', ');
}

export function categoryOptions(): { value: CategoryId; label: string }[] {
  return CATEGORIES.map((category) => ({ value: category.id, label: category.nameFr }));
}

export function emptySpecification(): Specification {
  return { labelFr: '', labelAr: '', valueFr: '', valueAr: '' };
}
