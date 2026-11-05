import { SITE } from '../config/business';

type PixelEvent = 'PageView' | 'ViewContent' | 'InitiateCheckout' | 'Purchase';

interface PixelProduct {
  slug: string;
  price: number;
}

interface PixelQueue {
  (...args: unknown[]): void;
  queue: unknown[];
  push: PixelQueue;
  loaded: boolean;
  version: string;
  callMethod?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    fbq?: PixelQueue;
    _fbq?: PixelQueue;
  }
}

/** Queues calls until Meta's script arrives. The official inline snippet is blocked by our CSP. */
function loadPixel(pixelId: string): PixelQueue {
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as PixelQueue;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', pixelId);
  return fbq;
}

/** Sends an event to Meta. Does nothing until `metaPixelId` is set in site.config.json. */
export function trackPixel(event: PixelEvent, params?: Record<string, unknown>): void {
  const pixelId = SITE.metaPixelId.trim();
  if (!/^\d{5,20}$/.test(pixelId)) return;
  // Tracking must never break an order.
  try {
    loadPixel(pixelId)('track', event, ...(params ? [params] : []));
  } catch {
    // Ignored on purpose.
  }
}

/** Product details only: customer names and phone numbers never go to Meta. */
export function productParams({ slug, price }: PixelProduct, value = price): Record<string, unknown> {
  return { content_ids: [slug], content_type: 'product', value, currency: 'DZD' };
}
