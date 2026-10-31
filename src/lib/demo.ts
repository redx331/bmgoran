import { SHIPPING_RATES_ARE_EXAMPLES } from '../config/shipping';
import { PRODUCTS } from '../data/products';

/**
 * True while the site still contains example data that must not be presented
 * as verified business information: demo products or example delivery rates.
 *
 * The demo banner and the footer notice disappear automatically once the
 * catalogue is real and `SHIPPING_RATES_ARE_EXAMPLES` is set to `false`.
 */
export function hasDemoData(): boolean {
  return PRODUCTS.some((product) => product.isDemo) || SHIPPING_RATES_ARE_EXAMPLES;
}
