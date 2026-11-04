import { describe, expect, it } from 'vitest';
import { getProductBySlug } from '../data/products';
import {
  MAX_QUANTITY,
  buildOrderMessage,
  calculateTotals,
  hasFieldError,
  isValidAlgerianPhone,
  normalizePhone,
  normalizeQuantity,
  validateOrderFields,
  type OrderFormValues,
} from '../lib/order';
import type { ShippingResult } from '../lib/shipping';
import { formatPrice } from '../lib/format';

const product = getProductBySlug('led-headlights');
if (!product) throw new Error('Test fixture missing: led-headlights');

const shipping: ShippingResult = {
  ok: true,
  quote: {
    amount: 700,
    method: 'home',
    wilaya: {
      code: '16',
      nameFr: 'Alger',
      nameAr: 'الجزائر',
      homeDeliveryPrice: 700,
      deskDeliveryPrice: 450,
    },
    isExample: false,
  },
};

const validValues: OrderFormValues = {
  name: 'Mohamed Benali',
  phone: '0550 12 34 56',
  wilayaCode: '16',
  deliveryMethod: 'home',
  quantity: 2,
};

describe('Algerian phone validation', () => {
  it.each([
    '0550123456',
    '0550 12 34 56',
    '0550-12-34-56',
    '+213550123456',
    '+213 550 12 34 56',
    '00213550123456',
    '0661234567',
    '0771234567',
  ])('accepts %s', (phone) => {
    expect(isValidAlgerianPhone(phone)).toBe(true);
  });

  it.each([
    '',
    '   ',
    '123',
    '0123456789',
    '055012345',
    '05501234567',
    '+33612345678',
    '0550 12 34 AB',
  ])('rejects %s', (phone) => {
    expect(isValidAlgerianPhone(phone)).toBe(false);
  });

  it('normalizes spaces, dashes and dots for the order message', () => {
    expect(normalizePhone(' 0550-12.34 (56) ')).toBe('0550123456');
  });
});

describe('quantity and totals', () => {
  it('accepts positive integers only', () => {
    expect(normalizeQuantity(1)).toBe(1);
    expect(normalizeQuantity('7')).toBe(7);
    expect(normalizeQuantity(MAX_QUANTITY)).toBe(MAX_QUANTITY);
  });

  it.each([0, -1, 1.5, MAX_QUANTITY + 1, Number.NaN, '', 'abc'])(
    'rejects invalid quantity %s',
    (value) => {
      expect(normalizeQuantity(value)).toBeNull();
    },
  );

  it('computes subtotal, shipping and final total without rounding tricks', () => {
    expect(calculateTotals(3500, 2, 700)).toEqual({
      unitPrice: 3500,
      quantity: 2,
      subtotal: 7000,
      shipping: 700,
      total: 7700,
    });
  });

  it('keeps free shipping at 0', () => {
    expect(calculateTotals(950, 1, 0).total).toBe(950);
  });

  it('refuses invalid monetary input instead of producing NaN', () => {
    expect(() => calculateTotals(3500.5, 1, 700)).toThrow();
    expect(() => calculateTotals(3500, 0, 700)).toThrow();
    expect(() => calculateTotals(3500, 1, -1)).toThrow();
  });
});

describe('checkout validation', () => {
  it('accepts a complete, valid order', () => {
    expect(
      validateOrderFields(validValues, {
        product,
        shipping,
      }),
    ).toEqual([]);
  });

  it('refuses an order while the delivery rate is an example', () => {
    const exampleShipping: ShippingResult = {
      ok: true,
      quote: {
        amount: 700,
        method: 'home',
        wilaya: {
          code: '16',
          nameFr: 'Alger',
          nameAr: 'الجزائر',
          homeDeliveryPrice: 700,
          deskDeliveryPrice: 450,
        },
        isExample: true,
      },
    };
    expect(
      validateOrderFields(validValues, { product, shipping: exampleShipping }),
    ).toContainEqual({ field: 'form', key: 'validation.rateNotVerified' });
  });

  it('requires every customer field', () => {
    const errors = validateOrderFields(
      {
        name: ' ',
        phone: '',
        wilayaCode: '',
        deliveryMethod: '',
        quantity: 0,
      },
      { product, shipping: null },
    );

    for (const field of [
      'name',
      'phone',
      'wilaya',
      'delivery',
      'quantity',
    ] as const) {
      expect(hasFieldError(errors, field), `missing error for ${field}`).toBe(true);
    }
  });

  it('rejects a malformed phone number', () => {
    const errors = validateOrderFields(
      { ...validValues, phone: '0123' },
      { product, shipping },
    );
    expect(errors).toContainEqual({ field: 'phone', key: 'validation.phoneInvalid' });
  });

  it('blocks a quantity above the maximum with the limit in the message', () => {
    const errors = validateOrderFields(
      { ...validValues, quantity: MAX_QUANTITY + 1 },
      { product, shipping },
    );
    expect(errors).toContainEqual({
      field: 'quantity',
      key: 'validation.quantityMax',
      vars: { max: MAX_QUANTITY },
    });
  });

  it('blocks checkout when the delivery rate is missing', () => {
    const errors = validateOrderFields(validValues, {
      product,
      shipping: { ok: false, reason: 'rate-not-configured' },
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.rateMissing' });
  });

  it('blocks checkout when the wilaya is unknown', () => {
    const errors = validateOrderFields(validValues, {
      product,
      shipping: { ok: false, reason: 'unknown-wilaya' },
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.wilayaInvalid' });
  });

  it('blocks an unavailable product', () => {
    const unavailable = getProductBySlug('motorcycle-chain-kit');
    if (!unavailable) throw new Error('Test fixture missing: motorcycle-chain-kit');
    const errors = validateOrderFields(validValues, {
      product: unavailable,
      shipping,
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.productUnavailable' });
  });

  it('blocks a missing product', () => {
    const errors = validateOrderFields(validValues, {
      product: undefined,
      shipping,
    });
    expect(errors).toEqual([{ field: 'form', key: 'validation.productMissing' }]);
  });
});

describe('order message', () => {
  const totals = calculateTotals(product.price, 2, 700);

  it('includes every order detail in French', () => {
    const message = buildOrderMessage({
      reference: 'ORD-2026-0001-ABC',
      product,
      quantity: 2,
      totals,
      name: 'Mohamed Benali',
      phone: '0550 12 34 56',
      wilayaName: 'Alger',
      wilayaCode: '16',
      deliveryMethod: 'home',
      isExampleRate: true,
      locale: 'fr',
      link: 'https://example.pages.dev/product/led-headlights',
    });

    for (const expected of [
      'NOUVELLE COMMANDE',
      'ORD-2026-0001-ABC',
      product.nameFr,
      'https://example.pages.dev/product/led-headlights',
      'Quantité: 2',
      formatPrice(3500, 'fr'),
      formatPrice(7000, 'fr'),
      'Mohamed Benali',
      '0550123456',
      'Alger (16)',
      'Livraison à domicile',
      formatPrice(700, 'fr'),
      formatPrice(7700, 'fr'),
      'tarif exemple',
    ]) {
      expect(message).toContain(expected);
    }
  });

  it('is localized in Arabic with Arabic product name and method', () => {
    const message = buildOrderMessage({
      reference: 'ORD-2026-0002-XYZ',
      product,
      quantity: 1,
      totals: calculateTotals(product.price, 1, 450),
      name: 'محمد بن علي',
      phone: '+213550123456',
      wilayaName: 'الجزائر',
      wilayaCode: '16',
      deliveryMethod: 'desk',
      isExampleRate: false,
      locale: 'ar',
      link: 'https://example.pages.dev/product/led-headlights',
    });

    expect(message).toContain('طلب جديد');
    expect(message).toContain(product.nameAr);
    expect(message).toContain('الاستلام من مكتب التوصيل');
    expect(message).toContain('الجزائر (16)');
    expect(message).not.toContain('tarif exemple');
  });

  it('includes the commune in the message when provided', () => {
    const message = buildOrderMessage({
      reference: 'ORD-2026-0003-COMM',
      product,
      quantity: 1,
      totals,
      name: 'Ahmed Mansour',
      phone: '0550123456',
      wilayaName: 'Oran',
      wilayaCode: '31',
      commune: 'Gdyel',
      deliveryMethod: 'home',
      isExampleRate: false,
      locale: 'fr',
      link: 'https://example.pages.dev/product/led-headlights',
    });

    expect(message).toContain('Oran (31) · Gdyel');
  });
});
