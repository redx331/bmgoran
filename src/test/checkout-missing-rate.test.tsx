import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from './render';

vi.mock('../config/business', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/business')>();
  return {
    ...actual,
    getWhatsAppStatus: () => ({ configured: true, number: '213550123456' }),
  };
});

// Simulates a wilaya whose rates have not been filled in yet.
vi.mock('../lib/shipping', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/shipping')>();
  return {
    ...actual,
    getShippingQuote: (
      code: string,
      method: 'home' | 'desk',
      options?: Parameters<typeof actual.getShippingQuote>[2],
    ) => {
      if (code === '16') {
        return {
          ok: false as const,
          reason: 'rate-not-configured' as const,
          wilaya: actual.findWilaya('16'),
        };
      }
      return actual.getShippingQuote(code, method, options);
    },
  };
});

describe('checkout when a wilaya rate is missing', () => {
  it('never treats a missing rate as free delivery and blocks the order', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
    await user.click(screen.getByRole('radio', { name: /Livraison à domicile/ }));

    expect(
      screen.getByText(/Le tarif de livraison n’est pas configuré pour cette wilaya/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Non configuré').length).toBeGreaterThan(0);

    const summary = document.querySelector('.summary-rows');
    expect(summary).toHaveTextContent('Non configuré');
    const shippingLabel = Array.from(summary?.querySelectorAll('.summary-row') ?? []).find(
      (row) => row.firstElementChild?.textContent === 'Livraison',
    );
    expect(shippingLabel?.lastElementChild?.textContent).toBe('Non configuré');

    expect(screen.getByRole('button', { name: /Commande indisponible/ })).toBeDisabled();
  });

  it('still allows a wilaya that has a configured rate', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '31');
    await user.click(screen.getByRole('radio', { name: /Retrait au bureau/ }));

    expect(
      screen.queryByText(/Le tarif de livraison n’est pas configuré pour cette wilaya/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ })).toBeEnabled();
  });
});
