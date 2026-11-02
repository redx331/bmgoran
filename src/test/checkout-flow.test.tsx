import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from './render';

// These flows place real orders, so run them with verified (non-example) rates.
vi.mock('../config/shipping', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/shipping')>();
  return { ...actual, SHIPPING_RATES_ARE_EXAMPLES: false };
});

const fetchMock = vi.fn<typeof fetch>();

async function fillValidCustomer(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Prénom/), 'Mohamed');
  await user.type(screen.getByLabelText(/^Nom/), 'Benali');
  await user.type(screen.getByLabelText(/Téléphone/), '0550 12 34 56');
  await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
  await user.click(screen.getByRole('radio', { name: /Livraison à domicile/ }));
  await user.click(screen.getByRole('checkbox'));
}

describe('placing an order', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(Response.json({ reference: 'ORD-2026-ABCD1234' }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('validates every required field before sending', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));

    expect(screen.getByText('Le prénom est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Le nom est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Le numéro de téléphone est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Sélectionnez votre wilaya.')).toBeInTheDocument();
    expect(screen.getByText('Choisissez un mode de livraison.')).toBeInTheDocument();
    expect(
      screen.getByText('Veuillez accepter la transmission de vos informations au magasin.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Veuillez corriger les champs indiqués.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Prénom/)).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a malformed phone number', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await fillValidCustomer(user);
    const phone = screen.getByLabelText(/Téléphone/);
    await user.clear(phone);
    await user.type(phone, '0123');
    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));

    expect(screen.getByText(/Numéro invalide/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a quantity above the maximum', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await fillValidCustomer(user);
    const quantity = screen.getByRole('spinbutton', { name: 'Quantité' });
    await user.clear(quantity);
    await user.type(quantity, '100');
    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));

    expect(screen.getByText('La quantité maximale est de 99.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the order and shows the reference from the server', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights?qty=2', locale: 'fr' });

    await fillValidCustomer(user);
    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/order');
    expect(JSON.parse(init?.body as string)).toEqual({
      productSlug: 'led-headlights',
      quantity: 2,
      firstName: 'Mohamed',
      lastName: 'Benali',
      phone: '0550 12 34 56',
      wilayaCode: '16',
      commune: '',
      deliveryMethod: 'home',
      consent: true,
      website: '',
    });

    const success = await screen.findByRole('status');
    expect(success).toHaveTextContent('Commande envoyée');
    expect(success).toHaveTextContent('ORD-2026-ABCD1234');
  });

  it('keeps the form and shows an error when sending fails', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'email-failed' }, { status: 502 }));
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await fillValidCustomer(user);
    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));

    expect(await screen.findByText(/La commande n’a pas pu être envoyée/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Prénom/)).toHaveValue('Mohamed');
    expect(screen.getByRole('button', { name: 'Passer la commande' })).toBeEnabled();
  });

  it('works in Arabic', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'ar' });

    await user.type(screen.getByLabelText(/^الاسم/), 'محمد');
    await user.type(screen.getByLabelText(/^اللقب/), 'بن علي');
    await user.type(screen.getByLabelText(/الهاتف/), '+213550123456');
    await user.selectOptions(screen.getByRole('combobox', { name: /الولاية/ }), '16');
    await user.click(screen.getByRole('radio', { name: /التوصيل إلى المنزل/ }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'أكّد الطلب' }));

    expect(await screen.findByRole('status')).toHaveTextContent('تم إرسال الطلب');
  });
});
