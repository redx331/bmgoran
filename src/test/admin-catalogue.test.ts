import { describe, expect, it } from 'vitest';
import type { Product } from '../data/products';
import {
  createEmptyProduct,
  emptySpecification,
  formatKeywords,
  nextImagePath,
  nextProductId,
  parseKeywords,
  prepareProduct,
  productsToJson,
  removeProduct,
  slugify,
  uniqueSlug,
  upsertProduct,
  validateProduct,
} from '../lib/admin/catalogue';

function validProduct(overrides: Partial<Product> = {}): Product {
  const base = createEmptyProduct([]);
  return {
    ...base,
    name: 'Phares LED',
    nameFr: 'Phares LED',
    nameAr: 'مصابيح LED',
    slug: 'phares-led',
    price: 3500,
    description: 'Description française valide.',
    descriptionFr: 'Description française valide.',
    descriptionAr: 'وصف عربي صالح للاختبار.',
    images: ['/images/products/phares-led-1.jpg'],
    ...overrides,
  };
}

describe('admin slug helpers', () => {
  it('builds URL-safe slugs from accented French names', () => {
    expect(slugify('Éclairage – H4 / 6000K')).toBe('eclairage-h4-6000k');
    expect(slugify('  Phares LED (paire)  ')).toBe('phares-led-paire');
    expect(slugify('!!!')).toBe('');
  });

  it('appends a number until the slug is unique', () => {
    const products = [
      validProduct({ slug: 'phares-led' }),
      validProduct({ slug: 'phares-led-2' }),
    ];
    expect(uniqueSlug('Phares LED', products)).toBe('phares-led-3');
    expect(uniqueSlug('Phares LED', products, 'phares-led')).toBe('phares-led');
    expect(uniqueSlug('Phares LED', products, 'phares-led-2')).toBe('phares-led-2');
  });

  it('picks the next free product id', () => {
    expect(nextProductId([])).toBe('p-001');
    expect(
      nextProductId([
        validProduct({ id: 'p-003' }),
        validProduct({ id: 'p-010' }),
        validProduct({ id: 'custom' }),
      ]),
    ).toBe('p-011');
  });
});

describe('createEmptyProduct', () => {
  it('creates a safe demo product with unverified compatibility', () => {
    const product = createEmptyProduct([validProduct({ id: 'p-007' })]);
    expect(product.id).toBe('p-008');
    expect(product.slug).toBe('nouveau-produit');
    expect(product.price).toBe(0);
    expect(product.isDemo).toBe(true);
    expect(product.featured).toBe(false);
    expect(product.compatibility?.verified).toBe(false);
    expect(product.images).toEqual([]);
  });
});

describe('nextImagePath', () => {
  it('continues the numbering and ignores other products', () => {
    const images = [
      '/images/products/phares-led-1.jpg',
      '/images/products/phares-led-3.png',
      '/images/products/autre-produit-9.jpg',
    ];
    expect(nextImagePath('phares-led', images)).toBe('/images/products/phares-led-4.jpg');
    expect(
      nextImagePath('phares-led', images, ['/images/products/phares-led-7.jpg']),
    ).toBe('/images/products/phares-led-8.jpg');
  });
});

describe('prepareProduct', () => {
  it('trims fields, syncs legacy columns and removes empty values', () => {
    const prepared = prepareProduct(
      validProduct({
        nameFr: '  Phares LED  ',
        name: 'ignored',
        nameAr: '  مصابيح LED  ',
        descriptionFr: '  Description française.  ',
        description: 'ignored',
        descriptionAr: '  وصف عربي.  ',
        images: [
          '/images/products/phares-led-1.jpg',
          '/images/products/phares-led-1.jpg',
        ],
        keywords: [' led ', 'led', '', 'h4'],
        partNumber: '   ',
        brand: '  ',
        specifications: [
          emptySpecification(),
          {
            labelFr: ' Matière ',
            labelAr: ' المادة ',
            valueFr: ' ABS ',
            valueAr: ' ABS ',
          },
        ],
      }),
    );

    expect(prepared.nameFr).toBe('Phares LED');
    expect(prepared.name).toBe('Phares LED');
    expect(prepared.nameAr).toBe('مصابيح LED');
    expect(prepared.descriptionFr).toBe('Description française.');
    expect(prepared.description).toBe('Description française.');
    expect(prepared.descriptionAr).toBe('وصف عربي.');
    expect(prepared.images).toEqual(['/images/products/phares-led-1.jpg']);
    expect(prepared.keywords).toEqual(['led', 'h4']);
    expect(prepared.partNumber).toBeUndefined();
    expect(prepared.brand).toBeUndefined();
    expect(prepared.specifications).toHaveLength(1);
    expect(prepared.specifications[0]?.labelFr).toBe('Matière');
  });
});

describe('validateProduct', () => {
  it('accepts a complete product', () => {
    expect(validateProduct(validProduct(), [])).toEqual({});
  });

  it('rejects missing names, prices and descriptions', () => {
    const errors = validateProduct(
      validProduct({
        nameFr: '',
        nameAr: ' ',
        price: 0,
        descriptionFr: 'court',
        descriptionAr: 'قصير',
      }),
      [],
    );
    expect(errors.nameFr).toBeTruthy();
    expect(errors.nameAr).toBeTruthy();
    expect(errors.price).toBeTruthy();
    expect(errors.descriptionFr).toBeTruthy();
    expect(errors.descriptionAr).toBeTruthy();
  });

  it('rejects non-integer and excessive prices', () => {
    expect(validateProduct(validProduct({ price: 1.5 }), []).price).toBeTruthy();
    expect(validateProduct(validProduct({ price: -10 }), []).price).toBeTruthy();
    expect(validateProduct(validProduct({ price: 10_000_001 }), []).price).toBeTruthy();
  });

  it('rejects invalid and duplicate slugs, but allows keeping the current one', () => {
    expect(validateProduct(validProduct({ slug: 'Phares LED' }), []).slug).toBeTruthy();
    expect(
      validateProduct(validProduct({ slug: 'phares-led' }), [validProduct()]).slug,
    ).toBeTruthy();
    expect(
      validateProduct(validProduct({ slug: 'phares-led' }), [validProduct()], 'phares-led').slug,
    ).toBeUndefined();
  });

  it('rejects partially filled specification rows', () => {
    const errors = validateProduct(
      validProduct({
        specifications: [
          { labelFr: 'Matière', labelAr: '', valueFr: 'ABS', valueAr: '' },
        ],
      }),
      [],
    );
    expect(errors.specifications).toBeTruthy();
  });

  it('accepts entirely empty specification rows (they are removed on save)', () => {
    const errors = validateProduct(
      validProduct({ specifications: [emptySpecification()] }),
      [],
    );
    expect(errors.specifications).toBeUndefined();
  });
});

describe('catalogue mutations', () => {
  it('appends a new product or replaces the edited one', () => {
    const first = validProduct({ slug: 'a', id: 'p-001' });
    const second = validProduct({ slug: 'b', id: 'p-002' });

    expect(upsertProduct([first], second, null)).toEqual([first, second]);

    const renamed = { ...first, nameFr: 'Nouveau nom', name: 'Nouveau nom' };
    const updated = upsertProduct([first, second], renamed, 'a');
    expect(updated).toHaveLength(2);
    expect(updated[0]?.nameFr).toBe('Nouveau nom');
  });

  it('removes a product by slug', () => {
    const first = validProduct({ slug: 'a' });
    const second = validProduct({ slug: 'b' });
    expect(removeProduct([first, second], 'a')).toEqual([second]);
  });

  it('serializes with a trailing newline and round-trips', () => {
    const product = validProduct();
    const json = productsToJson([product]);
    expect(json.endsWith('\n')).toBe(true);
    expect(JSON.parse(json)).toEqual([product]);
  });
});

describe('keywords helpers', () => {
  it('parses, trims, deduplicates and formats keywords', () => {
    expect(parseKeywords(' led, h4 ,, led ')).toEqual(['led', 'h4']);
    expect(formatKeywords(validProduct({ keywords: ['led', 'h4'] }))).toBe('led, h4');
    expect(formatKeywords(validProduct({ keywords: undefined }))).toBe('');
  });
});
