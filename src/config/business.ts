/**
 * BUSINESS / STORE CONFIGURATION
 * ==============================
 *
 * Edit `site.config.json` at the project root — not this file — to change:
 *   - business name (FR + AR) and brand initials
 *   - deployed site URL (used for canonical links and social sharing)
 *   - phone, address, opening hours, social links
 */

import siteConfig from '../../site.config.json';

export const SITE = {
  businessName: siteConfig.businessName,
  businessNameAr: siteConfig.businessNameAr,
  brandMark: siteConfig.brandMark,
  demoContact: siteConfig.demoContact,
  repository: siteConfig.repository,
  branch: siteConfig.branch,
  siteUrl: siteConfig.siteUrl.replace(/\/+$/, ''),
  phoneDisplay: siteConfig.phoneDisplay,
  phoneHref: siteConfig.phoneHref,
  addressFr: siteConfig.addressFr,
  addressAr: siteConfig.addressAr,
  cityFr: siteConfig.cityFr,
  cityAr: siteConfig.cityAr,
  openingHoursFr: siteConfig.openingHoursFr,
  openingHoursAr: siteConfig.openingHoursAr,
  facebookUrl: siteConfig.facebookUrl,
  instagramUrl: siteConfig.instagramUrl,
} as const;

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

