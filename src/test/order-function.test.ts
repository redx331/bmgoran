import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/order';

// The order endpoint must accept orders once rates are verified.
vi.mock('../config/shipping', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/shipping')>();
  return { ...actual, SHIPPING_RATES_ARE_EXAMPLES: false };
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

function post(body: unknown, env: Partial<typeof ENV> = ENV, origin = 'https://shop.example.test') {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return onRequestPost({
    request: new Request(URL_ORDER, { method: 'POST', headers: { Origin: origin }, body: payload }),
    env,
  });
}

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

describe('POST /api/order', () => {
  it('emails the order to the shop with every detail', async () => {
    const response = await post(VALID);

    expect(response.status).toBe(200);
    const { reference } = (await response.json()) as { reference: string };
    expect(reference).toMatch(/^ORD-\d{4}-[0-9A-F-]{8}$/);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.resend.com/emails');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-key');
    const email = JSON.parse(init?.body as string);
    expect(email.to).toEqual(['shop@example.test']);
    expect(email.subject).toContain(reference);
    for (const expected of [
      reference,
      'Phares LED H4 6000K (paire)',
      'Quantité: 2',
      'Mohamed Benali',
      '0550123456',
      'Alger (16) · Hydra',
      'Livraison à domicile',
    ]) {
      expect(email.text).toContain(expected);
    }
  });

  it('ignores prices sent by the browser', async () => {
    await post({ ...VALID, price: 1, total: 1, shipping: 0 });
    const email = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(email.text).toMatch(/7\D?700/);
  });

  it.each([
    ['missing first name', { firstName: '  ' }],
    ['invalid phone', { phone: '0123' }],
    ['unknown product', { productSlug: 'nope' }],
    ['out-of-stock product', { productSlug: 'motorcycle-chain-kit' }],
    ['invalid quantity', { quantity: 100 }],
    ['quantity sent as text', { quantity: '2' }],
    ['unknown wilaya', { wilayaCode: '99' }],
    ['invalid delivery method', { deliveryMethod: 'drone' }],
    ['missing consent', { consent: false }],
    ['oversized name', { firstName: 'x'.repeat(81) }],
  ])('rejects %s without sending', async (_name, change) => {
    const response = await post({ ...VALID, ...change });
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flattens line breaks so a customer cannot forge order lines', async () => {
    await post({ ...VALID, lastName: 'Benali\nTOTAL: 1 DA' });
    const email = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(email.text).not.toMatch(/^TOTAL: 1 DA$/m);
  });

  it('rejects malformed, oversized and cross-site requests', async () => {
    expect((await post('{nope')).status).toBe(400);
    expect((await post('null')).status).toBe(400);
    expect((await post('x'.repeat(4097))).status).toBe(413);
    expect((await post(VALID, ENV, 'https://evil.example')).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pretends to accept honeypot submissions without sending', async () => {
    const response = await post({ ...VALID, website: 'https://spam.example' });
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports failure instead of losing an order silently', async () => {
    expect((await post(VALID, {})).status).toBe(503);

    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 403 }));
    expect((await post(VALID)).status).toBe(502);

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect((await post(VALID)).status).toBe(502);
  });
});
