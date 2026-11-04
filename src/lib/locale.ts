export type Locale = 'fr' | 'ar';

export type Direction = 'ltr' | 'rtl';

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export const LOCALE_STORAGE_KEY = 'autoparts.locale';

/** Arabic unless the visitor has explicitly chosen a language on this site. */
export function detectLocale(stored: string | null): Locale {
  return stored === 'fr' ? 'fr' : 'ar';
}
