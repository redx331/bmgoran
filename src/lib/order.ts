import type { DeliveryMethod, ShippingResult } from './shipping';
import type { Product } from '../data/products';
import type { Locale } from './locale';
import type { TranslationKey } from '../i18n/translations';
import { formatPrice } from './format';

export const MAX_QUANTITY = 99;

export interface OrderFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  wilayaCode: string;
  commune?: string;
  deliveryMethod: DeliveryMethod | '';
  quantity: number;
}

export type ValidationField =
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'wilaya'
  | 'delivery'
  | 'quantity'
  | 'form';

export interface ValidationError {
  field: ValidationField;
  key: TranslationKey;
  vars?: Record<string, string | number>;
}

export interface OrderTotals {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  shipping: number;
  total: number;
}

/** Removes spaces, dashes, dots and parentheses; keeps + and digits. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-.()/]/g, '').trim();
}

/**
 * Accepts Algerian mobile numbers in local (05/06/07), +213 and 00213 forms.
 * International format is accepted only with the Algerian country code, because
 * this store delivers inside Algeria.
 */
export function isValidAlgerianPhone(raw: string): boolean {
  const phone = normalizePhone(raw);
  if (!phone) return false;
  return (
    /^0[5-7]\d{8}$/.test(phone) ||
    /^\+213[5-7]\d{8}$/.test(phone) ||
    /^00213[5-7]\d{8}$/.test(phone)
  );
}

export function normalizeQuantity(value: number | string): number | null {
  const quantity = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return null;
  }
  return quantity;
}

export function calculateTotals(
  unitPrice: number,
  quantity: number,
  shipping: number,
): OrderTotals {
  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    throw new Error('Invalid unit price');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Invalid quantity');
  }
  if (!Number.isInteger(shipping) || shipping < 0) {
    throw new Error('Invalid shipping amount');
  }
  const subtotal = unitPrice * quantity;
  return { unitPrice, quantity, subtotal, shipping, total: subtotal + shipping };
}

export function validateOrderFields(
  values: OrderFormValues,
  context: {
    product?: Product;
    shipping: ShippingResult | null;
  },
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!context.product) {
    errors.push({ field: 'form', key: 'validation.productMissing' });
    return errors;
  }

  if (context.product.stockStatus === 'out_of_stock') {
    errors.push({ field: 'form', key: 'validation.productUnavailable' });
  }

  if (!values.firstName.trim()) {
    errors.push({ field: 'firstName', key: 'validation.firstNameRequired' });
  }
  if (!values.lastName.trim()) {
    errors.push({ field: 'lastName', key: 'validation.lastNameRequired' });
  }

  if (!normalizePhone(values.phone)) {
    errors.push({ field: 'phone', key: 'validation.phoneRequired' });
  } else if (!isValidAlgerianPhone(values.phone)) {
    errors.push({ field: 'phone', key: 'validation.phoneInvalid' });
  }

  if (!values.wilayaCode) {
    errors.push({ field: 'wilaya', key: 'validation.wilayaRequired' });
  }

  if (!values.deliveryMethod) {
    errors.push({ field: 'delivery', key: 'validation.deliveryRequired' });
  }

  if (normalizeQuantity(values.quantity) === null) {
    errors.push({
      field: 'quantity',
      key: values.quantity > MAX_QUANTITY ? 'validation.quantityMax' : 'validation.quantityInvalid',
      vars: { max: MAX_QUANTITY },
    });
  }

  if (values.wilayaCode && values.deliveryMethod) {
    if (!context.shipping || !context.shipping.ok) {
      errors.push({
        field: 'form',
        key:
          context.shipping && !context.shipping.ok && context.shipping.reason === 'unknown-wilaya'
            ? 'validation.wilayaInvalid'
            : 'validation.rateMissing',
      });
    } else if (context.shipping.quote.isExample) {
      errors.push({ field: 'form', key: 'validation.rateNotVerified' });
    }
  }

  return errors;
}

export function hasFieldError(errors: ValidationError[], field: ValidationField): boolean {
  return errors.some((error) => error.field === field);
}

export function getFieldError(
  errors: ValidationError[],
  field: ValidationField,
): ValidationError | undefined {
  return errors.find((error) => error.field === field);
}

/* -------------------------------------------------------------------------- */
/* Order message                                                              */
/* -------------------------------------------------------------------------- */

export interface OrderMessageInput {
  reference: string;
  product: Product;
  quantity: number;
  totals: OrderTotals;
  firstName: string;
  lastName: string;
  phone: string;
  wilayaName: string;
  wilayaCode: string;
  commune?: string;
  deliveryMethod: DeliveryMethod;
  isExampleRate: boolean;
  locale: Locale;
  link: string;
}

export interface OrderRequest {
  productSlug: string;
  quantity: number;
  firstName: string;
  lastName: string;
  phone: string;
  wilayaCode: string;
  commune: string;
  deliveryMethod: DeliveryMethod;
  /** Honeypot: stays empty for real customers. */
  website: string;
}

/** Sends the order to the shop and returns its reference. Throws on any failure. */
export async function submitOrder(order: OrderRequest): Promise<string> {
  const response = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error(`Order failed with status ${response.status}`);
  const { reference } = (await response.json()) as { reference?: string };
  if (!reference) throw new Error('Order response has no reference');
  return reference;
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const { locale } = input;
  const isAr = locale === 'ar';
  const labels = isAr
    ? {
        heading: 'طلب جديد',
        reference: 'المرجع',
        product: 'المنتج',
        link: 'الرابط',
        quantity: 'الكمية',
        unitPrice: 'سعر الوحدة',
        subtotal: 'المجموع الفرعي',
        customer: 'العميل',
        phone: 'الهاتف',
        wilaya: 'الولاية',
        delivery: 'التوصيل',
        home: 'التوصيل إلى المنزل',
        desk: 'الاستلام من مكتب التوصيل',
        shipping: 'رسوم التوصيل',
        total: 'المجموع الكلي',
        example: 'سعر تجريبي',
        note: 'ملاحظة: رسوم التوصيل المعروضة تجريبية ويجب تأكيدها مع المتجر.',
      }
    : {
        heading: 'NOUVELLE COMMANDE',
        reference: 'Référence',
        product: 'Produit',
        link: 'Lien',
        quantity: 'Quantité',
        unitPrice: 'Prix unitaire',
        subtotal: 'Sous-total',
        customer: 'Client',
        phone: 'Téléphone',
        wilaya: 'Wilaya',
        delivery: 'Livraison',
        home: 'Livraison à domicile',
        desk: 'Retrait au bureau de livraison',
        shipping: 'Frais de livraison',
        total: 'TOTAL',
        example: 'tarif exemple',
        note: 'Remarque : les frais de livraison affichés sont des tarifs d’exemple à confirmer avec la boutique.',
      };

  const methodLabel = input.deliveryMethod === 'home' ? labels.home : labels.desk;
  const shippingText = `${formatPrice(input.totals.shipping, locale)}${
    input.isExampleRate ? ` (${labels.example})` : ''
  }`;

  const lines = [
    labels.heading,
    '',
    `${labels.reference}: ${input.reference}`,
    `${labels.product}: ${isAr ? input.product.nameAr : input.product.nameFr || input.product.name}`,
    `${labels.link}: ${input.link}`,
    `${labels.quantity}: ${input.quantity}`,
    `${labels.unitPrice}: ${formatPrice(input.totals.unitPrice, locale)}`,
    `${labels.subtotal}: ${formatPrice(input.totals.subtotal, locale)}`,
    '',
    `${labels.customer}: ${input.firstName.trim()} ${input.lastName.trim()}`,
    `${labels.phone}: ${normalizePhone(input.phone)}`,
    `${labels.wilaya}: ${input.wilayaName} (${input.wilayaCode})${
      input.commune?.trim() ? ` · ${input.commune.trim()}` : ''
    }`,
    `${labels.delivery}: ${methodLabel}`,
    `${labels.shipping}: ${shippingText}`,
    '',
    `${labels.total}: ${formatPrice(input.totals.total, locale)}`,
  ];

  if (input.isExampleRate) {
    lines.push('', labels.note);
  }

  return lines.join('\n');
}
