import { render, type RenderResult } from '@testing-library/react';
import { App } from '../App';
import { I18nProvider } from '../i18n/I18nProvider';
import { RouterProvider } from '../lib/router';
import type { Locale } from '../lib/locale';

interface RenderAppOptions {
  /** Path including query string, e.g. `/checkout/led-headlights?qty=2`. */
  path?: string;
  /** Force a locale. Omit to exercise stored/browser locale detection. */
  locale?: Locale;
}

/**
 * Renders the real application (providers + layout + routes) at a given URL,
 * so deep links, navigation and page metadata are exercised as in production.
 */
export function renderApp({ path = '/', locale }: RenderAppOptions = {}): RenderResult {
  window.history.replaceState({}, '', path);
  return render(
    <I18nProvider initialLocale={locale}>
      <RouterProvider>
        <App />
      </RouterProvider>
    </I18nProvider>,
  );
}
