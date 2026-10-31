/**
 * BUSINESS / STORE CONFIGURATION
 * ==============================
 *
 * Edit `site.config.json` at the project root — not this file — to change:
 *   - business name (FR + AR) and brand initials
 *   - deployed site URL (used for canonical links and social sharing)
 *   - WhatsApp number
 *   - phone, e-mail, address, opening hours, social links
 *
 * WHATSAPP NUMBER FORMAT
 * ----------------------
 * International format, digits only, with the country code and WITHOUT "+",
 * "00" or the leading domestic 0. For an Algerian mobile 0550 12 34 56, use:
 *   "213550123456"
 * Leave it as "" until you have the real number: checkout will be disabled and
 * will explain that ordering is not available yet.
 */

import siteConfig from '../../site.config.json';

export interface WhatsAppStatus {
  configured: boolean;
  number: string;
  reason?: 'missing' | 'invalid';
}

export const SITE = {
  businessName: siteConfig.businessName,
  businessNameAr: siteConfig.businessNameAr,
  brandMark: siteConfig.brandMark,
  demoContact: siteConfig.demoContact,
  repository: siteConfig.repository,
  branch: siteConfig.branch,
  siteUrl: siteConfig.siteUrl.replace(/\/+$/, ''),
  whatsappNumber: siteConfig.whatsappNumber,
  phoneDisplay: siteConfig.phoneDisplay,
  phoneHref: siteConfig.phoneHref,
  email: siteConfig.email,
  addressFr: siteConfig.addressFr,
  addressAr: siteConfig.addressAr,
  cityFr: siteConfig.cityFr,
  cityAr: siteConfig.cityAr,
  openingHoursFr: siteConfig.openingHoursFr,
  openingHoursAr: siteConfig.openingHoursAr,
  facebookUrl: siteConfig.facebookUrl,
  instagramUrl: siteConfig.instagramUrl,
} as const;

/**
 * Returns digits-only international number, or null when missing/invalid.
 * Accepts "+213…", "00213…" and spaced/dashed numbers for convenience, but the
 * value used in the wa.me URL is always digits only.
 */
export function normalizeWhatsAppNumber(raw: string): string | null {
  const cleaned = raw.replace(/[\s+().-]/g, '');
  if (!cleaned) return null;
  const digits = cleaned.startsWith('00') ? cleaned.slice(2) : cleaned;
  if (!/^\d{9,15}$/.test(digits)) return null;
  return digits;
}

export function getWhatsAppStatus(raw: string = SITE.whatsappNumber): WhatsAppStatus {
  const trimmed = raw.trim();
  if (!trimmed) return { configured: false, number: '', reason: 'missing' };
  const number = normalizeWhatsAppNumber(trimmed);
  if (!number) return { configured: false, number: '', reason: 'invalid' };
  return { configured: true, number };
}

/** Builds a click-to-chat URL. Returns null if the number is not valid. */
export function buildWhatsAppUrl(number: string, message: string): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Absolute URL of a path, based on the configured production domain. */
export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.siteUrl}${normalizedPath}`;
}

export function productPath(slug: string): string {
  return `/product/${encodeURIComponent(slug)}`;
}

export function productUrl(slug: string): string {
  return absoluteUrl(productPath(slug));
}

/**
 * Product URL using the browser's current origin. This is what customers share
 * in WhatsApp, so it stays correct even if the site URL in the config has not
 * been updated yet. Falls back to the configured URL outside a browser.
 */
export function runtimeProductUrl(slug: string): string {
  if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
    return `${window.location.origin}${productPath(slug)}`;
  }
  return productUrl(slug);
}
