import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from './render';
import { formatPrice } from '../lib/format';

/**
 * Simulates a store where the WhatsApp number has been configured. The real
 * URL builder still runs, so this test also checks the wa.me payload end to end.
 */
vi.mock('../config/business', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/business')>();
  return {
    ...actual,
    getWhatsAppStatus: () => ({ configured: true, number: '213550123456' }),
  };
});

async function fillValidCustomer(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Prénom/), 'Mohamed');
  await user.type(screen.getByLabelText(/^Nom/), 'Benali');
  await user.type(screen.getByLabelText(/Téléphone/), '0550 12 34 56');
  await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
  await user.click(screen.getByRole('radio', { name: /Livraison à domicile/ }));
  await user.click(screen.getByRole('checkbox'));
}

describe('checkout with a configured WhatsApp number', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('validates every required field before opening WhatsApp', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.click(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ }));

    expect(screen.getByText('Le prénom est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Le nom est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Le numéro de téléphone est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Sélectionnez votre wilaya.')).toBeInTheDocument();
    expect(screen.getByText('Choisissez un mode de livraison.')).toBeInTheDocument();
    expect(
      screen.getByText('Veuillez accepter la transmission des informations via WhatsApp.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Veuillez corriger les champs indiqués.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Prénom/)).toHaveFocus();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('rejects a malformed phone number', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await fillValidCustomer(user);
    const phone = screen.getByLabelText(/Téléphone/);
    await user.clear(phone);
    await user.type(phone, '0123');
    await user.click(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ }));

    expect(screen.getByText(/Numéro invalide/)).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('rejects a quantity above the maximum', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await fillValidCustomer(user);
    const quantity = screen.getByRole('spinbutton', { name: 'Quantité' });
    await user.clear(quantity);
    await user.type(quantity, '100');
    await user.click(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ }));

    expect(screen.getByText('La quantité maximale est de 99.')).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('builds an encoded WhatsApp message with every order detail', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights?qty=2', locale: 'fr' });

    await fillValidCustomer(user);
    await user.click(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = openSpy.mock.calls[0]?.[0] as string;
    expect(url).toMatch(/^https:\/\/wa\.me\/213550123456\?text=/);

    const message = new URL(url).searchParams.get('text') ?? '';
    for (const expected of [
      'NOUVELLE COMMANDE',
      'Phares LED H4 6000K (paire)',
      'Quantité: 2',
      formatPrice(3500, 'fr'),
      formatPrice(7000, 'fr'),
      formatPrice(7700, 'fr'),
      'Mohamed Benali',
      '0550123456',
      'Alger (16)',
      'Livraison à domicile',
      'tarif exemple',
      'http://localhost',
    ]) {
      expect(message).toContain(expected);
    }

    const success = screen.getByRole('status');
    expect(success).toHaveTextContent('Message prêt dans WhatsApp');
    expect(
      screen.getByText(/Votre commande n’est pas encore confirmée/),
    ).toBeInTheDocument();

    const reference = success.querySelector('code')?.textContent ?? '';
    expect(reference).toMatch(/^ORD-\d{4}-\d{4}-[A-Z0-9]{3}$/);
    expect(message).toContain(reference);
  });

  it('offers a copy button and a way to reopen WhatsApp', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });
    await fillValidCustomer(user);
    await user.click(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ }));

    const message = new URL(openSpy.mock.calls[0]?.[0] as string).searchParams.get('text') ?? '';
    await user.click(screen.getByRole('button', { name: 'Copier le message' }));

    expect(writeText).toHaveBeenCalledWith(message);
    expect(screen.getByRole('button', { name: 'Message copié' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Rouvrir WhatsApp/ })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/213550123456?text='),
    );
  });

  it('resets the success panel when the customer edits the order', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await fillValidCustomer(user);
    await user.click(screen.getByRole('button', { name: /Envoyer la commande sur WhatsApp/ }));
    expect(screen.getByRole('status')).toBeInTheDocument();

    const quantity = screen.getByRole('spinbutton', { name: 'Quantité' });
    await user.clear(quantity);
    await user.type(quantity, '2');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('works in Arabic with an Arabic message', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'ar' });

    await user.type(screen.getByLabelText(/^الاسم/), 'محمد');
    await user.type(screen.getByLabelText(/^اللقب/), 'بن علي');
    await user.type(screen.getByLabelText(/الهاتف/), '+213550123456');
    await user.selectOptions(screen.getByRole('combobox', { name: /الولاية/ }), '16');
    await user.click(screen.getByRole('radio', { name: /التوصيل إلى المنزل/ }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /أرسل الطلب عبر واتساب/ }));

    const url = openSpy.mock.calls[0]?.[0] as string;
    const message = new URL(url).searchParams.get('text') ?? '';
    expect(message).toContain('طلب جديد');
    expect(message).toContain('مصابيح LED H4 بدرجة 6000K (زوج)');
    expect(message).toContain('محمد بن علي');
    expect(message).toContain('الجزائر (16)');
    expect(message).toContain('التوصيل إلى المنزل');
  });
});
