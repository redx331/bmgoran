import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/shipping', () => ({ SHIPPING_RATES_ARE_EXAMPLES: false }));
vi.mock('../data/products', () => ({ PRODUCTS: [{ isDemo: false }, { isDemo: false }] }));

import { hasDemoData } from '../lib/demo';

describe('hasDemoData', () => {
  it('returns false when the catalogue is real and the rates are not examples', () => {
    expect(hasDemoData()).toBe(false);
  });
});
