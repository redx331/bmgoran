import {
  SHIPPING_RATES_ARE_EXAMPLES,
  WILAYAS,
  type WilayaShipping,
} from '../config/shipping';

export type DeliveryMethod = 'home' | 'desk';

export interface ShippingQuote {
  amount: number;
  method: DeliveryMethod;
  wilaya: WilayaShipping;
  /** True while the prices in the config are still examples. */
  isExample: boolean;
}

export type ShippingFailureReason = 'unknown-wilaya' | 'rate-not-configured';

export type ShippingResult =
  | { ok: true; quote: ShippingQuote }
  | { ok: false; reason: ShippingFailureReason; wilaya?: WilayaShipping };

export function findWilaya(
  code: string,
  wilayas: readonly WilayaShipping[] = WILAYAS,
): WilayaShipping | undefined {
  return wilayas.find((wilaya) => wilaya.code === code);
}

export function getWilayaPrice(
  wilaya: WilayaShipping,
  method: DeliveryMethod,
): number | null {
  return method === 'home' ? wilaya.homeDeliveryPrice : wilaya.deskDeliveryPrice;
}

/**
 * Resolves the authoritative shipping price.
 *
 * A missing (`null`) or invalid rate is NEVER replaced by 0. It returns a
 * failure so the checkout can block the order and show an explanation.
 * A configured `0` is kept: it means genuine free delivery.
 */
export function getShippingQuote(
  code: string,
  method: DeliveryMethod,
  options: {
    wilayas?: readonly WilayaShipping[];
    ratesAreExamples?: boolean;
  } = {},
): ShippingResult {
  const wilaya = findWilaya(code, options.wilayas ?? WILAYAS);
  if (!wilaya) {
    return { ok: false, reason: 'unknown-wilaya' };
  }

  const amount = getWilayaPrice(wilaya, method);
  if (amount === null || !Number.isFinite(amount) || amount < 0) {
    return { ok: false, reason: 'rate-not-configured', wilaya };
  }

  return {
    ok: true,
    quote: {
      amount,
      method,
      wilaya,
      isExample: options.ratesAreExamples ?? SHIPPING_RATES_ARE_EXAMPLES,
    },
  };
}

/**
 * True when a quote exists but its price is still an example. Checkout and the
 * order endpoint must refuse to take an order in that state.
 */
export function isExampleShipping(result: ShippingResult | null): boolean {
  return result !== null && result.ok && result.quote.isExample;
}

/** A wilaya is "served" when at least one delivery method has a rate. */
export function hasAnyRate(wilaya: WilayaShipping): boolean {
  return wilaya.homeDeliveryPrice !== null || wilaya.deskDeliveryPrice !== null;
}

export function wilayaName(wilaya: WilayaShipping, locale: 'fr' | 'ar'): string {
  return locale === 'ar' ? wilaya.nameAr : wilaya.nameFr;
}
