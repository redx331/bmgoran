import type { Locale } from './locale';

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

/** Formats an integer amount in Algerian dinars, e.g. 3500 → "3 500 DA". */
export function formatPrice(amount: number | null | undefined, locale: Locale): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return '—';
  }
  return `${numberFormatter.format(amount)} ${locale === 'ar' ? 'دج' : 'DA'}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
