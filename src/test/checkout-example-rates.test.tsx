import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from './render';

// Simulates the state before verified courier rates are entered.
vi.mock('../config/shipping', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/shipping')>();
  return { ...actual, SHIPPING_RATES_ARE_EXAMPLES: true };
});

describe('checkout while delivery rates are examples', () => {
  it('warns that the price is an example and blocks the order', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
    await user.click(screen.getByRole('radio', { name: /Livraison à domicile/ }));

    expect(
      screen.getByText(/Les frais de livraison affichés sont des tarifs d’exemple/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Commande indisponible' })).toBeDisabled();
  });
});
