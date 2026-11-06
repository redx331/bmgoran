import { describe, expect, it } from 'vitest';
import {
  SHIPPING_RATES_ARE_EXAMPLES,
  WILAYAS,
  type WilayaShipping,
} from '../config/shipping';
import {
  findWilaya,
  getShippingQuote,
  getWilayaPrice,
  hasAnyRate,
  isExampleShipping,
  wilayaName,
} from '../lib/shipping';

const SAMPLE = (overrides: Partial<WilayaShipping> = {}): WilayaShipping => ({
  code: '99',
  nameFr: 'Test',
  nameAr: 'اختبار',
  homeDeliveryPrice: 700,
  deskDeliveryPrice: 450,
  ...overrides,
});

describe('Algerian wilaya shipping configuration', () => {
  it('covers all 69 wilayas exactly once, in official order', () => {
    expect(WILAYAS).toHaveLength(69);
    expect(WILAYAS.map((wilaya) => wilaya.code)).toEqual(
      Array.from({ length: 69 }, (_, index) => String(index + 1).padStart(2, '0')),
    );
  });

  it('provides Arabic and French names for every wilaya', () => {
    for (const wilaya of WILAYAS) {
      expect(wilaya.nameFr.trim(), `wilaya ${wilaya.code} nameFr`).not.toBe('');
      expect(wilaya.nameAr.trim(), `wilaya ${wilaya.code} nameAr`).not.toBe('');
    }
  });

  it('ships verified ZR Express rates, not examples', () => {
    expect(SHIPPING_RATES_ARE_EXAMPLES).toBe(false);
  });

  it('keeps one price per delivery method and never a negative amount', () => {
    for (const wilaya of WILAYAS) {
      for (const price of [wilaya.homeDeliveryPrice, wilaya.deskDeliveryPrice]) {
        if (price !== null) {
          expect(Number.isInteger(price), `wilaya ${wilaya.code}`).toBe(true);
          expect(price).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('resolves the Yalidine home and desk prices', () => {
    const home = getShippingQuote('16', 'home');
    const desk = getShippingQuote('16', 'desk');

    expect(home.ok).toBe(true);
    expect(desk.ok).toBe(true);
    if (home.ok && desk.ok) {
      expect(home.quote.amount).toBe(650);
      expect(desk.quote.amount).toBe(500);
      expect(home.quote.isExample).toBe(false);
      expect(home.quote.wilaya.code).toBe('16');
    }
  });

  it('returns a failure — never 0 — when a rate is not configured', () => {
    const wilayas = [SAMPLE({ homeDeliveryPrice: null, deskDeliveryPrice: null })];
    expect(getShippingQuote('99', 'home', { wilayas })).toEqual({
      ok: false,
      reason: 'rate-not-configured',
      wilaya: wilayas[0],
    });
    expect(getShippingQuote('99', 'desk', { wilayas })).toMatchObject({
      ok: false,
      reason: 'rate-not-configured',
    });
  });

  it('preserves a genuine free delivery rate of 0', () => {
    const wilayas = [SAMPLE({ homeDeliveryPrice: 0, deskDeliveryPrice: 0 })];
    const result = getShippingQuote('99', 'home', { wilayas });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.quote.amount).toBe(0);
      // A real 0 is free delivery; it is not example data.
      expect(result.quote.isExample).toBe(false);
    }
  });

  it('rejects unknown wilaya codes', () => {
    expect(getShippingQuote('00', 'home').ok).toBe(false);
    expect(getShippingQuote('00', 'home')).toEqual({ ok: false, reason: 'unknown-wilaya' });
    expect(findWilaya('XX')).toBeUndefined();
  });

  it('marks quotes as examples only when explicitly asked', () => {
    const result = getShippingQuote('16', 'home', { ratesAreExamples: true });
    expect(result.ok && result.quote.isExample).toBe(true);
    expect(getShippingQuote('16', 'home')).toMatchObject({
      ok: true,
      quote: { isExample: false },
    });
  });

  it('flags example and missing quotes as not orderable', () => {
    expect(
      isExampleShipping(getShippingQuote('16', 'home', { ratesAreExamples: true })),
    ).toBe(true);
    expect(isExampleShipping(getShippingQuote('16', 'home'))).toBe(false);
    expect(isExampleShipping({ ok: false, reason: 'rate-not-configured' })).toBe(false);
    expect(isExampleShipping(null)).toBe(false);
  });

  it('reports wilaya coverage and localized names', () => {
    const served = SAMPLE();
    const unserved = SAMPLE({ homeDeliveryPrice: null, deskDeliveryPrice: null });
    expect(hasAnyRate(served)).toBe(true);
    expect(hasAnyRate(unserved)).toBe(false);
    expect(getWilayaPrice(served, 'home')).toBe(700);
    expect(getWilayaPrice(served, 'desk')).toBe(450);
    expect(wilayaName(served, 'fr')).toBe('Test');
    expect(wilayaName(served, 'ar')).toBe('اختبار');
  });

  it('never returns NaN or a negative amount for any configured wilaya', () => {
    for (const wilaya of WILAYAS) {
      for (const method of ['home', 'desk'] as const) {
        const result = getShippingQuote(wilaya.code, method);
        if (result.ok) {
          expect(Number.isFinite(result.quote.amount)).toBe(true);
          expect(result.quote.amount).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
