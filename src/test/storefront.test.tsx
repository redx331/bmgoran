import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SITE } from '../config/business';
import { PRODUCTS } from '../data/products';
import { formatPrice } from '../lib/format';
import { renderApp } from './render';

describe('deep links and routing', () => {
  it('renders every product from its own permanent URL', () => {
    for (const product of PRODUCTS) {
      const { unmount } = renderApp({ path: `/product/${product.slug}`, locale: 'fr' });
      expect(
        screen.getByRole('heading', { level: 1, name: product.nameFr }),
        `deep link failed for ${product.slug}`,
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('sets a product-specific title, Open Graph image and canonical URL', () => {
    renderApp({ path: '/product/led-headlights', locale: 'fr' });

    expect(document.title).toContain('Phares LED H4 6000K (paire)');
    expect(document.title).toContain(formatPrice(3500, 'fr'));
    expect(document.title).toContain(SITE.businessName);
    expect(
      document.head.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ).toContain('/og/led-headlights.png');
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toContain('/product/led-headlights');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow',
    );
  });

  it('shows a useful not-found page for an unknown product and marks it noindex', () => {
    renderApp({ path: '/product/unknown-part', locale: 'fr' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Produit introuvable');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
  });

  it('shows the not-found page for an unknown route', () => {
    renderApp({ path: '/this/does/not/exist', locale: 'fr' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page introuvable');
  });

  it('opens checkout with the chosen quantity from a product page', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/product/led-headlights', locale: 'fr' });

    await user.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));
    await user.click(
      screen.getAllByRole('button', { name: /Commander maintenant/ })[0] as HTMLElement,
    );

    expect(window.location.pathname).toBe('/checkout/led-headlights');
    expect(window.location.search).toBe('?qty=2');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Finaliser la commande');
  });

  it('does not offer checkout for an out-of-stock product', () => {
    renderApp({ path: '/product/motorcycle-chain-kit', locale: 'fr' });

    expect(screen.getByText('Produit indisponible')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Commander maintenant/ }),
    ).not.toBeInTheDocument();
  });

  it('filters the shop by part number through the URL', () => {
    renderApp({ path: '/shop?q=DEMO-BP-104', locale: 'fr' });

    expect(screen.getByText('1 produit(s)')).toBeInTheDocument();
    const results = document.querySelector('.product-grid');
    expect(results).not.toBeNull();
    expect(within(results as HTMLElement).getByText('Plaquettes de frein avant')).toBeInTheDocument();
  });

  it('links the hero product to its permanent URL', () => {
    renderApp({ path: '/', locale: 'fr' });
    const hero = document.querySelector('.hero__visual');
    expect(hero).toHaveAttribute('href', '/product/led-headlights');
  });
});

describe('bilingual interface', () => {
  it('opens a product link in Arabic by default, whatever the browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    renderApp({ path: '/product/led-headlights' });
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('مصابيح LED H4');
  });

  it('keeps a language the visitor chose', () => {
    window.localStorage.setItem('autoparts.locale', 'fr');
    renderApp({ path: '/product/led-headlights' });
    expect(document.documentElement.lang).toBe('fr');
  });

  it('starts in French with LTR attributes', () => {
    renderApp({ path: '/', locale: 'fr' });
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('La bonne pièce,');
  });

  it('switches to Arabic, applies RTL and persists the choice', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp({ path: '/', locale: 'fr' });

    await user.click(screen.getByRole('button', { name: 'العربية' }));

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(window.localStorage.getItem('autoparts.locale')).toBe('ar');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('القطعة المناسبة،');
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    unmount();
    renderApp({ path: '/' });
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('القطعة المناسبة،');
  });

  it('switches back to French and applies LTR again', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/', locale: 'ar' });
    expect(document.documentElement.dir).toBe('rtl');

    await user.click(screen.getByRole('button', { name: 'Français' }));

    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(window.localStorage.getItem('autoparts.locale')).toBe('fr');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('La bonne pièce,');
  });

  it('translates the 69-wilaya delivery table', () => {
    const { unmount } = renderApp({ path: '/delivery', locale: 'fr' });
    expect(screen.queryAllByText('Tarifs d’exemple')).toHaveLength(0);
    const frenchRows = document.querySelectorAll('.rates-table tbody tr');
    expect(frenchRows.length).toBe(69);
    expect(frenchRows[15]).toHaveTextContent('Alger');
    unmount();

    renderApp({ path: '/delivery', locale: 'ar' });
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.queryAllByText('أسعار تجريبية')).toHaveLength(0);

    const arabicRows = document.querySelectorAll('.rates-table tbody tr');
    expect(arabicRows.length).toBe(69);
    expect(arabicRows[15]).toHaveTextContent('الجزائر');
  });

  it('localizes prices in Arabic dinars', () => {
    renderApp({ path: '/product/led-headlights', locale: 'ar' });
    const price = document.querySelector('.product-price');
    expect(price).not.toBeNull();
    expect(price?.textContent).toContain('دج');
    expect(price?.textContent?.replace(/\s/g, '')).toBe(
      formatPrice(3500, 'ar').replace(/\s/g, ''),
    );
  });
});

describe('demo disclosures', () => {
  it('keeps a visible demo banner and demo product notice', () => {
    renderApp({ path: '/product/led-headlights', locale: 'fr' });
    expect(screen.getByLabelText('Avis de démonstration')).toBeInTheDocument();
    expect(screen.getByText(/Démonstration : ce produit/)).toBeInTheDocument();
    expect(screen.getAllByText('Prix démo').length).toBeGreaterThan(0);
  });

  it('does not mark verified delivery prices as examples', () => {
    renderApp({ path: '/delivery', locale: 'fr' });
    expect(
      screen.queryByText(/Ces montants ne sont pas des tarifs réels de transporteur/),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Oran')).toBeInTheDocument();
  });
});
