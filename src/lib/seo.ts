import { useEffect } from 'react';
import { absoluteUrl, SITE } from '../config/business';
import type { Locale } from './locale';

interface PageMeta {
  title: string;
  description: string;
  /** Absolute or root-relative path to a 1200×630 social image. */
  image?: string;
  path: string;
  type?: 'website' | 'product';
  locale: Locale;
  noindex?: boolean;
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

function absoluteImage(image: string | undefined, fallback: string): string {
  if (!image) return absoluteUrl(fallback);
  if (/^https?:\/\//i.test(image)) return image;
  return absoluteUrl(image);
}

/** Keeps the document head in sync on client-side navigation. */
export function usePageMeta(meta: PageMeta): void {
  const { title, description, image, path, type = 'website', locale, noindex } = meta;

  useEffect(() => {
    const fullTitle = title.includes(SITE.businessName)
      ? title
      : `${title} | ${SITE.businessName}`;
    const imageUrl = absoluteImage(image, '/og/default.png');
    const canonical = absoluteUrl(path);

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:image:width', '1200');
    upsertMeta('property', 'og:image:height', '630');
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:site_name', SITE.businessName);
    upsertMeta('property', 'og:locale', locale === 'ar' ? 'ar_DZ' : 'fr_DZ');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', canonical);
  }, [title, description, image, path, type, locale, noindex]);
}
