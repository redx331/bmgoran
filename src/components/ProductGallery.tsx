import { useEffect, useRef, useState } from 'react';
import { getProductName, type Product } from '../data/products';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from './Icon';

export function ProductGallery({ product }: { product: Product }) {
  const { t, locale, dir } = useI18n();
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const name = getProductName(product, locale);
  const images = product.images.length > 0 ? product.images : ['/images/products/placeholder.svg'];

  useEffect(() => {
    setIndex(0);
    const track = trackRef.current;
    if (track) track.scrollLeft = 0;
  }, [product.slug]);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    setIndex(clamped);
    const track = trackRef.current;
    const slide = track?.children.item(clamped) as HTMLElement | null;
    if (slide && typeof slide.scrollIntoView === 'function') {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    let best = 0;
    let bestOverlap = -1;
    Array.from(track.children).forEach((child, childIndex) => {
      const rect = child.getBoundingClientRect();
      const overlap = Math.min(rect.right, trackRect.right) - Math.max(rect.left, trackRect.left);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = childIndex;
      }
    });
    setIndex(best);
  };

  return (
    <div className="product-gallery">
      <div className="product-gallery__viewer">
        <div
          ref={trackRef}
          className="product-gallery__track"
          onScroll={handleScroll}
          aria-label={t('product.galleryLabel')}
          role="group"
          aria-roledescription="carousel"
          dir={dir}
        >
          {images.map((src, imageIndex) => (
            <div
              className="product-gallery__slide"
              key={src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${imageIndex + 1} / ${images.length}`}
            >
              <img
                src={src}
                alt={t('product.imageAlt', { name, index: imageIndex + 1 })}
                width={800}
                height={600}
                loading={imageIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={imageIndex === 0 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--prev"
              onClick={() => goTo(index - 1)}
              aria-label={t('product.galleryPrev')}
              disabled={index === 0}
            >
              <Icon name="arrow-left" size={20} className="directional-icon" />
            </button>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--next"
              onClick={() => goTo(index + 1)}
              aria-label={t('product.galleryNext')}
              disabled={index === images.length - 1}
            >
              <Icon name="arrow-right" size={20} className="directional-icon" />
            </button>
            <span className="product-gallery__counter" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="product-gallery__thumbs" role="group" aria-label={t('product.galleryLabel')}>
          {images.map((src, imageIndex) => (
            <button
              key={src}
              type="button"
              className={`product-gallery__thumb${imageIndex === index ? ' is-active' : ''}`}
              onClick={() => goTo(imageIndex)}
              aria-label={t('product.imageAlt', { name, index: imageIndex + 1 })}
              aria-pressed={imageIndex === index}
            >
              <img src={src} alt="" width={800} height={600} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
