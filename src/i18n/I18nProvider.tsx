import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  detectLocale,
  getDirection,
  LOCALE_STORAGE_KEY,
  type Direction,
  type Locale,
} from '../lib/locale';
import { translations, type TranslationKey } from './translations';

interface I18nValue {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLocale(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getInitialLocale(initialLocale?: Locale): Locale {
  if (initialLocale) return initialLocale;
  return detectLocale(readStoredLocale(), navigator.language);
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale(initialLocale));

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = getDirection(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Private mode / storage full: the language simply is not remembered.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = translations[locale][key] ?? translations.fr[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
      );
    },
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, dir: getDirection(locale), setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return value;
}
