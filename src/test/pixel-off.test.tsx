import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { trackPixel } from '../lib/pixel';
import { renderApp } from './render';

vi.mock('../config/business', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/business')>();
  return { ...actual, SITE: { ...actual.SITE, metaPixelId: '' } };
});

describe('Meta Pixel without an ID', () => {
  it('loads nothing and stays out of the privacy notice', () => {
    trackPixel('PageView');
    renderApp({ path: '/contact', locale: 'ar' });

    expect(window.fbq).toBeUndefined();
    expect(document.querySelector('script[src*="connect.facebook.net"]')).toBeNull();
    expect(screen.queryByText(/Meta/)).toBeNull();
  });
});
