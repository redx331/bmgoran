import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from './render';

vi.mock('../config/business', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/business')>();
  return { ...actual, SITE: { ...actual.SITE, metaPixelId: '1234567890' } };
});

function sentEvents(): unknown[][] {
  return (window.fbq?.queue ?? []) as unknown[][];
}

function lastEvent(name: string): unknown[] | undefined {
  return sentEvents().filter((call) => call[0] === 'track' && call[1] === name).at(-1);
}

describe('Meta Pixel events', () => {
  beforeEach(() => {
    if (window.fbq) window.fbq.queue.length = 0;
  });

  it('loads Meta once and reports a product view', () => {
    renderApp({ path: '/product/led-headlights', locale: 'ar' });

    expect(document.querySelectorAll('script[src*="connect.facebook.net"]')).toHaveLength(1);
    expect(sentEvents().some((call) => call[0] === 'init' && call[1] === '1234567890')).toBe(true);
    expect(lastEvent('PageView')).toBeDefined();
    expect(lastEvent('ViewContent')?.[2]).toEqual({
      content_ids: ['led-headlights'],
      content_type: 'product',
      value: 3500,
      currency: 'DZD',
    });
  });

  it('reports the checkout, then the purchase with the total but no customer details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ reference: 'ORD-2026-ABCD1234' })),
    );
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights?qty=2', locale: 'fr' });

    expect(lastEvent('InitiateCheckout')?.[2]).toMatchObject({ value: 7000, currency: 'DZD' });
    expect(lastEvent('Purchase')).toBeUndefined();

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Mohamed Benali');
    await user.type(screen.getByLabelText(/Téléphone/), '0550123456');
    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));
    await screen.findByRole('status');

    expect(lastEvent('Purchase')?.[2]).toEqual({
      content_ids: ['led-headlights'],
      content_type: 'product',
      value: 7650,
      currency: 'DZD',
    });
    const sent = JSON.stringify(sentEvents());
    expect(sent).not.toContain('Benali');
    expect(sent).not.toContain('0550123456');
  });

  it('does not report a purchase when the order fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: 'email-failed' }, { status: 502 })),
    );
    const user = userEvent.setup();
    renderApp({ path: '/checkout/led-headlights', locale: 'fr' });

    await user.type(screen.getByLabelText(/Nom et prénom/), 'Mohamed Benali');
    await user.type(screen.getByLabelText(/Téléphone/), '0550123456');
    await user.selectOptions(screen.getByRole('combobox', { name: /Wilaya/ }), '16');
    await user.click(screen.getByRole('button', { name: 'Passer la commande' }));
    await screen.findByText(/La commande n’a pas pu être envoyée/);

    expect(lastEvent('Purchase')).toBeUndefined();
  });

  it('never tracks the admin area', () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })));
    renderApp({ path: '/admin', locale: 'fr' });
    expect(lastEvent('PageView')).toBeUndefined();
  });

  it('tells customers about the pixel in the privacy notice', () => {
    renderApp({ path: '/contact', locale: 'ar' });
    expect(screen.getByText(/Meta/)).toBeInTheDocument();
  });
});
