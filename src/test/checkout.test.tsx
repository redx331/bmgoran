import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { formatPrice } from '../lib/format';
import { renderApp } from './render';

function summaryValue(label: string): string {
  const rows = document.querySelector('.summary-rows');
  if (!rows) throw new Error('Order summary not rendered');
  const labelElement = within(rows as HTMLElement).getByText(label, { exact: true });
  const row = labelElement.closest('.summary-row');
  if (!row) throw new Error(`Summary row not found for ${label}`);
  return row.lastElementChild?.textContent ?? '';
}

describe('checkout with the shipped placeholder configuration', () => {
  it('explains that WhatsApp is not configured and disables ordering', () => {
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    expect(screen.getByText('Commande WhatsApp indisponible')).toBeInTheDocument();
    expect(
      screen.getByText(/Le numéro WhatsApp du magasin n’est pas encore configuré/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Commande indisponible/ })).toBeDisabled();
  });

  it('shows privacy information and states that sending happens inside WhatsApp', () => {
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    expect(screen.getByRole('heading', { name: 'Confidentialité' })).toBeInTheDocument();
    expect(
      screen.getByText(/Ce site ne possède ni compte client ni base de données/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Vous devrez appuyer sur « Envoyer » dans WhatsApp/),
    ).toBeInTheDocument();
  });

  it('recalculates subtotal, shipping and total live', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights?qty=2', locale: 'fr' });

    // Quantity comes from the product page deep link.
    expect(summaryValue('Sous-total')).toBe(formatPrice(7000, 'fr'));
    expect(summaryValue('Total à payer')).toBe('—');

    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
    expect(summaryValue('Livraison')).toContain('Choisissez un mode de livraison');

    await user.click(screen.getByRole('radio', { name: /Livraison à domicile/ }));
    expect(summaryValue('Livraison')).toContain(formatPrice(700, 'fr'));
    expect(summaryValue('Livraison')).toContain('Tarif exemple');
    expect(summaryValue('Total à payer')).toBe(formatPrice(7700, 'fr'));

    // Changing the delivery method updates shipping and the final total.
    await user.click(screen.getByRole('radio', { name: /Retrait au bureau/ }));
    expect(summaryValue('Livraison')).toContain(formatPrice(450, 'fr'));
    expect(summaryValue('Total à payer')).toBe(formatPrice(7450, 'fr'));

    // Changing the quantity updates the subtotal and the final total.
    const quantity = screen.getByRole('spinbutton', { name: 'Quantité' });
    await user.clear(quantity);
    await user.type(quantity, '3');
    expect(summaryValue('Sous-total')).toBe(formatPrice(10500, 'fr'));
    expect(summaryValue('Total à payer')).toBe(formatPrice(10950, 'fr'));
  });

  it('warns that the displayed delivery price is an example', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
    await user.click(screen.getByRole('radio', { name: /Livraison à domicile/ }));

    expect(
      screen.getByText(/Les frais de livraison affichés sont des tarifs d’exemple/),
    ).toBeInTheDocument();
  });

  it('refuses checkout for an out-of-stock product', () => {
    renderApp({ path: '/checkout/motorcycle-chain-kit', locale: 'fr' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ce produit ne peut pas être commandé',
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les autres produits' })).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown checkout slug', () => {
    renderApp({ path: '/checkout/unknown-part', locale: 'fr' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Produit introuvable');
  });

  it('is fully translated and RTL in Arabic', () => {
    renderApp({ path: '/checkout/led-headlights', locale: 'ar' });

    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('إتمام الطلب');
    expect(screen.getByRole('button', { name: /الطلب غير متاح/ })).toBeDisabled();
    expect(screen.getByText('ملخص الطلب')).toBeInTheDocument();
    expect(screen.getByText(/السعر|المجموع الكلي/)).toBeInTheDocument();
  });
});
