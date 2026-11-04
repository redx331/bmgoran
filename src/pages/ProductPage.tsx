import { useState } from 'react';
import { getCategoryName } from '../data/categories';
import {
  getProductBySlug,
  getProductDescription,
  getProductName,
  relatedProducts,
} from '../data/products';
import { useI18n } from '../i18n/I18nProvider';
import { formatPrice } from '../lib/format';
import { Link, useRouter } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { MAX_QUANTITY, normalizeQuantity } from '../lib/order';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { ProductGallery } from '../components/ProductGallery';
import { QuantityStepper } from '../components/QuantityStepper';
import { StockBadge } from '../components/StockBadge';

export function ProductPage({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const product = getProductBySlug(slug);
  const [quantity, setQuantity] = useState(1);

  const name = product ? getProductName(product, locale) : '';
  const price = product ? formatPrice(product.price, locale) : '';

  usePageMeta({
    title: product
      ? t('seo.productTitle', { name, price })
      : t('product.notFoundTitle'),
    description: product
      ? getProductDescription(product, locale).slice(0, 180)
      : t('product.notFoundText'),
    image: product ? `/og/${product.slug}.png` : undefined,
    path: product ? `/product/${product.slug}` : `/product/${slug}`,
    type: product ? 'product' : 'website',
    locale,
    noindex: !product,
  });

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <span className="empty-state__icon">
              <Icon name="search" size={28} />
            </span>
            <h1>{t('product.notFoundTitle')}</h1>
            <p>{t('product.notFoundText')}</p>
            <Link to="/shop" className="btn btn--primary">
              {t('product.backToShop')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const categoryName = getCategoryName(product.category, locale);
  const description = getProductDescription(product, locale);
  const available = product.stockStatus !== 'out_of_stock';
  const quantityIsValid = normalizeQuantity(quantity) !== null;
  const safeQuantity = normalizeQuantity(quantity) ?? 1;
  const related = relatedProducts(product);

  const goToCheckout = () => {
    if (!available || !quantityIsValid) return;
    navigate(`/checkout/${product.slug}?qty=${safeQuantity}`);
  };

  return (
    <div className="product-page">
      <div className="container">
        <nav className="breadcrumb" aria-label={t('a11y.breadcrumb')}>
          <Link to="/">{t('common.home')}</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/shop?category=${product.category}`}>{categoryName}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <div className="product-layout">
          <div className="product-layout__media">
            <ProductGallery product={product} />
            {product.isDemo && (
              <p className="media-demo-note">
                <Icon name="alert" size={15} />
                {t('product.demoNotice')}
              </p>
            )}
          </div>

          <div className="product-layout__info">
            <div className="product-topline">
              <Link to={`/shop?category=${product.category}`} className="product-category">
                {categoryName}
              </Link>
              <StockBadge status={product.stockStatus} />
            </div>

            <h1 className="product-title">{name}</h1>

            {product.partNumber && (
              <p className="product-part">
                {t('product.partNumber')}: <span dir="ltr">{product.partNumber}</span>
              </p>
            )}

            <div className="product-price-block">
              <span className="product-price">{formatPrice(product.price, locale)}</span>
              {product.isDemo && <span className="badge badge--demo">{t('common.demoPriceShort')}</span>}
            </div>
            <p className="product-price-note">{t('product.shippingAtCheckout')}</p>

            <p className="product-description">{description}</p>

            <div className="product-order-panel">
              <div className="product-order-row">
                <span className="field-label">{t('product.quantity')}</span>
                <QuantityStepper
                  value={quantity}
                  onChange={(next) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, next)) || 1)}
                  inputId="product-quantity"
                  label={t('product.quantity')}
                  disabled={!available}
                />
              </div>

              {available ? (
                <>
                  <button
                    type="button"
                    className="btn btn--primary btn--block btn--lg"
                    onClick={goToCheckout}
                    disabled={!quantityIsValid}
                  >
                    <Icon name="package" size={20} />
                    {t('product.orderCta')}
                    <Icon name="arrow-right" size={18} className="directional-icon" />
                  </button>
                  <p className="order-note">
                    <Icon name="phone" size={15} />
                    {t('checkout.orderHint')}
                  </p>
                </>
              ) : (
                <div className="notice notice--warn">
                  <Icon name="alert" size={20} />
                  <div>
                    <strong>{t('product.unavailable')}</strong>
                    <p>{t('product.unavailableText')}</p>
                    <Link to="/shop" className="text-link">
                      {t('product.backToShop')}
                      <Icon name="arrow-right" size={15} className="directional-icon" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="product-help">
              <div>
                <h2>{t('product.needHelp')}</h2>
                <p>{t('product.needHelpText')}</p>
              </div>
              <Link to="/contact" className="btn btn--ghost btn--sm">
                  {t('product.helpCta')}
                </Link>
            </div>
          </div>
        </div>

        <div className="product-details">
          <section className="detail-block" aria-labelledby="specs-title">
            <h2 id="specs-title">{t('product.specifications')}</h2>
            <dl className="spec-list">
              {product.specifications.map((spec) => (
                <div className="spec-row" key={`${spec.labelFr}-${spec.valueFr}`}>
                  <dt>{locale === 'ar' ? spec.labelAr : spec.labelFr}</dt>
                  <dd>{locale === 'ar' ? spec.valueAr : spec.valueFr}</dd>
                </div>
              ))}
              {product.partNumber && (
                <div className="spec-row">
                  <dt>{t('product.partNumber')}</dt>
                  <dd dir="ltr">{product.partNumber}</dd>
                </div>
              )}
              <div className="spec-row">
                <dt>{t('product.category')}</dt>
                <dd>{categoryName}</dd>
              </div>
            </dl>
          </section>
        </div>

        {related.length > 0 && (
          <section className="section section--related" aria-labelledby="related-title">
            <div className="section-heading section-heading--row">
              <h2 id="related-title">{t('product.related')}</h2>
              <Link to={`/shop?category=${product.category}`} className="text-link">
                {t('product.viewAllInCategory')}
                <Icon name="arrow-right" size={16} className="directional-icon" />
              </Link>
            </div>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {available && (
        <div className="mobile-buy-bar">
          <div className="mobile-buy-bar__price">
            <span>{formatPrice(product.price * safeQuantity, locale)}</span>
            <small>{t('product.quantity')} : {safeQuantity}</small>
          </div>
          <button type="button" className="btn btn--primary" onClick={goToCheckout} disabled={!quantityIsValid}>
            {t('product.orderCta')}
            <Icon name="arrow-right" size={17} className="directional-icon" />
          </button>
        </div>
      )}
    </div>
  );
}
