import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppUrl,
  getWhatsAppStatus,
  normalizeWhatsAppNumber,
} from '../config/business';
import { getProductBySlug } from '../data/products';
import {
  MAX_QUANTITY,
  buildOrderMessage,
  calculateTotals,
  hasFieldError,
  isValidAlgerianPhone,
  nextOrderReference,
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
    isExample: true,
  },
};

const validValues: OrderFormValues = {
  firstName: 'Mohamed',
  lastName: 'Benali',
  phone: '0550 12 34 56',
  wilayaCode: '16',
  deliveryMethod: 'home',
  quantity: 2,
  consent: true,
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

  it('normalizes spaces, dashes and dots for the WhatsApp message', () => {
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
        whatsappConfigured: true,
      }),
    ).toEqual([]);
  });

  it('requires every customer field and the consent checkbox', () => {
    const errors = validateOrderFields(
      {
        firstName: ' ',
        lastName: '',
        phone: '',
        wilayaCode: '',
        deliveryMethod: '',
        quantity: 0,
        consent: false,
      },
      { product, shipping: null, whatsappConfigured: true },
    );

    for (const field of [
      'firstName',
      'lastName',
      'phone',
      'wilaya',
      'delivery',
      'quantity',
      'consent',
    ] as const) {
      expect(hasFieldError(errors, field), `missing error for ${field}`).toBe(true);
    }
  });

  it('rejects a malformed phone number', () => {
    const errors = validateOrderFields(
      { ...validValues, phone: '0123' },
      { product, shipping, whatsappConfigured: true },
    );
    expect(errors).toContainEqual({ field: 'phone', key: 'validation.phoneInvalid' });
  });

  it('blocks a quantity above the maximum with the limit in the message', () => {
    const errors = validateOrderFields(
      { ...validValues, quantity: MAX_QUANTITY + 1 },
      { product, shipping, whatsappConfigured: true },
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
      whatsappConfigured: true,
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.rateMissing' });
  });

  it('blocks checkout when the wilaya is unknown', () => {
    const errors = validateOrderFields(validValues, {
      product,
      shipping: { ok: false, reason: 'unknown-wilaya' },
      whatsappConfigured: true,
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.wilayaInvalid' });
  });

  it('blocks checkout while WhatsApp is not configured', () => {
    const errors = validateOrderFields(validValues, {
      product,
      shipping,
      whatsappConfigured: false,
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.whatsappMissing' });
  });

  it('blocks an unavailable product', () => {
    const unavailable = getProductBySlug('motorcycle-chain-kit');
    if (!unavailable) throw new Error('Test fixture missing: motorcycle-chain-kit');
    const errors = validateOrderFields(validValues, {
      product: unavailable,
      shipping,
      whatsappConfigured: true,
    });
    expect(errors).toContainEqual({ field: 'form', key: 'validation.productUnavailable' });
  });

  it('blocks a missing product', () => {
    const errors = validateOrderFields(validValues, {
      product: undefined,
      shipping,
      whatsappConfigured: true,
    });
    expect(errors).toEqual([{ field: 'form', key: 'validation.productMissing' }]);
  });
});

describe('WhatsApp configuration', () => {
  it('treats an empty number as not configured instead of inventing one', () => {
    expect(getWhatsAppStatus('')).toEqual({ configured: false, number: '', reason: 'missing' });
    expect(getWhatsAppStatus('   ')).toEqual({ configured: false, number: '', reason: 'missing' });
  });

  it('rejects an invalid number', () => {
    expect(getWhatsAppStatus('abc')).toEqual({
      configured: false,
      number: '',
      reason: 'invalid',
    });
  });

  it('normalizes accepted number formats to digits only', () => {
    expect(normalizeWhatsAppNumber('+213 550 12 34 56')).toBe('213550123456');
    expect(normalizeWhatsAppNumber('00213550123456')).toBe('213550123456');
    expect(normalizeWhatsAppNumber('213-550-123-456')).toBe('213550123456');
    expect(getWhatsAppStatus('+213 550 12 34 56')).toEqual({
      configured: true,
      number: '213550123456',
    });
  });

  it('returns no URL when the number is unusable', () => {
    expect(buildWhatsAppUrl('', 'hello')).toBeNull();
    expect(buildWhatsAppUrl('abc', 'hello')).toBeNull();
  });
});

describe('order reference', () => {
  it('is readable, session-scoped and increments inside one session', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const now = new Date('2026-10-30T12:00:00Z');

    const first = nextOrderReference(now, storage);
    const second = nextOrderReference(now, storage);

    expect(first).toMatch(/^ORD-2026-\d{4}-[A-Z0-9]{3}$/);
    expect(second).toMatch(/^ORD-2026-0002-[A-Z0-9]{3}$/);
    expect(first.slice(0, 13)).toBe('ORD-2026-0001');
  });

  it('falls back to an in-memory sequence when storage is unavailable', () => {
    const reference = nextOrderReference(new Date('2026-01-01T00:00:00Z'), null);
    expect(reference).toMatch(/^ORD-2026-\d{4}-[A-Z0-9]{3}$/);
  });
});

describe('WhatsApp order message', () => {
  const totals = calculateTotals(product.price, 2, 700);

  it('includes every order detail in French and is fully URL-encoded', () => {
    const message = buildOrderMessage({
      reference: 'ORD-2026-0001-ABC',
      product,
      quantity: 2,
      totals,
      firstName: 'Mohamed',
      lastName: 'Benali',
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

    const url = buildWhatsAppUrl('213550123456', message);
    expect(url).not.toBeNull();
    expect(url).toMatch(/^https:\/\/wa\.me\/213550123456\?text=/);

    const parsed = new URL(url as string);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('wa.me');
    expect(parsed.pathname).toBe('/213550123456');
    // Round-trip proves &, ?, #, newlines and Arabic cannot break the link.
    expect(parsed.searchParams.get('text')).toBe(message);
    expect(parsed.search).not.toContain(' ');
  });

  it('is localized in Arabic with Arabic product name and method', () => {
    const message = buildOrderMessage({
      reference: 'ORD-2026-0002-XYZ',
      product,
      quantity: 1,
      totals: calculateTotals(product.price, 1, 450),
      firstName: 'محمد',
      lastName: 'بن علي',
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

    const url = buildWhatsAppUrl('213550123456', message);
    expect(new URL(url as string).searchParams.get('text')).toBe(message);
  });

  it('includes the commune in the WhatsApp message when provided', () => {
    const message = buildOrderMessage({
      reference: 'ORD-2026-0003-COMM',
      product,
      quantity: 1,
      totals,
      firstName: 'Ahmed',
      lastName: 'Mansour',
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

  it('keeps an ampersand, question mark, hash and emoji intact through encoding', () => {
    const message = 'Produit & accessoire ? #1 🔧\nLigne 2';
    const url = buildWhatsAppUrl('213550123456', message);
    expect(new URL(url as string).searchParams.get('text')).toBe(message);
  });
});
