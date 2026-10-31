import { getCategoryName } from '../data/categories';
import { getProductName, type Product } from '../data/products';
import { useI18n } from '../i18n/I18nProvider';
import { formatPrice } from '../lib/format';
import { Link } from '../lib/router';
import { Icon } from './Icon';
import { StockBadge } from './StockBadge';

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { t, locale } = useI18n();
  const name = getProductName(product, locale);
  const href = `/product/${product.slug}`;
  const image = product.images[0] ?? '/images/products/placeholder.svg';

  return (
    <article className="product-card">
      <Link to={href} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <img
          src={image}
          alt=""
          width={800}
          height={600}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
        {product.isDemo && (
          <span className="badge badge--demo">
            {t('common.demo')}
          </span>
        )}
        <span className="product-card__stock">
          <StockBadge status={product.stockStatus} />
        </span>
      </Link>

      <div className="product-card__body">
        <span className="product-card__category">{getCategoryName(product.category, locale)}</span>
        <h3 className="product-card__title">
          <Link to={href}>{name}</Link>
        </h3>
        {product.partNumber && (
          <span className="product-card__part" dir="ltr">
            {t('product.partNumber')}: {product.partNumber}
          </span>
        )}

        <div className="product-card__footer">
          <div className="product-card__price-group">
            <span className="price">{formatPrice(product.price, locale)}</span>
            {product.isDemo && <span className="price-note">{t('common.demoPriceShort')}</span>}
          </div>
          <Link to={href} className="product-card__cta" aria-label={`${t('common.seeProduct')} — ${name}`}>
            <span>{t('common.seeProduct')}</span>
            <Icon name="arrow-right" size={17} className="directional-icon" />
          </Link>
        </div>
      </div>
    </article>
  );
}
