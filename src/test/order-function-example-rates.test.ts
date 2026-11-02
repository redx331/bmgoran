import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/order';

// Ordering must stay closed while the delivery grid is still example data.
vi.mock('../config/shipping', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/shipping')>();
  return { ...actual, SHIPPING_RATES_ARE_EXAMPLES: true };
});

const ENV = { RESEND_API_KEY: 'test-key', ORDER_EMAIL_TO: 'shop@example.test' };
const URL_ORDER = 'https://shop.example.test/api/order';

const VALID = {
  productSlug: 'led-headlights',
  quantity: 2,
  firstName: 'Mohamed',
  lastName: 'Benali',
  phone: '0550 12 34 56',
  wilayaCode: '16',
  commune: 'Hydra',
  deliveryMethod: 'home',
  consent: true,
  website: '',
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(Response.json({ id: 'email-id' }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/order while rates are examples', () => {
  it('refuses the order and sends no email', async () => {
    const response = await onRequestPost({
      request: new Request(URL_ORDER, {
        method: 'POST',
        headers: { Origin: 'https://shop.example.test' },
        body: JSON.stringify(VALID),
      }),
      env: ENV,
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'rates-not-verified' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
