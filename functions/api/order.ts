import { productUrl } from '../../src/config/business';
import { getProductBySlug } from '../../src/data/products';
import {
  buildOrderMessage,
  calculateTotals,
  isValidAlgerianPhone,
  normalizeQuantity,
} from '../../src/lib/order';
import { getShippingQuote, wilayaName } from '../../src/lib/shipping';

interface Env {
  RESEND_API_KEY?: string;
  ORDER_EMAIL_TO?: string;
}

const MAX_BODY_LENGTH = 4096;
// shortcut: Resend's shared sender only delivers to the Resend account's own address, use a verified domain to send elsewhere.
const EMAIL_FROM = 'BMG Oran <onboarding@resend.dev>';

function json(status: number, body: Record<string, string>): Response {
  return Response.json(body, { status });
}

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length <= maxLength ? cleaned : null;
}

function createReference(now: Date = new Date()): string {
  return `ORD-${now.getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * Validates an order and emails it to the shop. Product price and delivery
 * rate come from the deployed catalogue, never from the browser.
 */
export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json(403, { error: 'forbidden' });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) return json(413, { error: 'too-large' });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('Not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: 'invalid-json' });
  }

  // Honeypot: only bots fill this hidden field, so pretend it worked and send nothing.
  if (body.website) return json(200, { reference: createReference() });

  const name = text(body.name, 160);
  const phone = text(body.phone, 30);
  const commune = text(body.commune ?? '', 100);
  const product = typeof body.productSlug === 'string' ? getProductBySlug(body.productSlug) : undefined;
  const quantity = typeof body.quantity === 'number' ? normalizeQuantity(body.quantity) : null;
  const shipping =
    typeof body.wilayaCode === 'string' && (body.deliveryMethod === 'home' || body.deliveryMethod === 'desk')
      ? getShippingQuote(body.wilayaCode, body.deliveryMethod)
      : null;

  if (
    !name ||
    !phone ||
    !isValidAlgerianPhone(phone) ||
    commune === null ||
    !product ||
    product.stockStatus === 'out_of_stock' ||
    quantity === null ||
    !shipping?.ok
  ) {
    return json(422, { error: 'invalid-order' });
  }

  if (!env.RESEND_API_KEY || !env.ORDER_EMAIL_TO) {
    console.error('Order email is not configured');
    return json(503, { error: 'not-configured' });
  }

  // Never take a real order while the delivery grid is still example data.
  if (shipping.quote.isExample) {
    return json(409, { error: 'rates-not-verified' });
  }

  const reference = createReference();
  const message = buildOrderMessage({
    reference,
    product,
    quantity,
    totals: calculateTotals(product.price, quantity, shipping.quote.amount),
    name,
    phone,
    wilayaName: wilayaName(shipping.quote.wilaya, 'fr'),
    wilayaCode: shipping.quote.wilaya.code,
    commune,
    deliveryMethod: shipping.quote.method,
    isExampleRate: shipping.quote.isExample,
    locale: 'fr',
    link: productUrl(product.slug),
  });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [env.ORDER_EMAIL_TO],
        subject: `Nouvelle commande ${reference}`,
        text: message,
      }),
    });
    if (!response.ok) {
      console.error(`Order email rejected with status ${response.status}`);
      return json(502, { error: 'email-failed' });
    }
  } catch {
    console.error('Order email request failed');
    return json(502, { error: 'email-failed' });
  }

  return json(200, { reference });
}
