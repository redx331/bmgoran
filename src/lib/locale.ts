export type Locale = 'fr' | 'ar';

export type Direction = 'ltr' | 'rtl';

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export const LOCALE_STORAGE_KEY = 'autoparts.locale';

export function detectLocale(
  stored: string | null,
  browserLanguage: string | undefined,
): Locale {
  if (stored === 'ar' || stored === 'fr') return stored;
  return browserLanguage?.toLowerCase().startsWith('ar') ? 'ar' : 'fr';
}
