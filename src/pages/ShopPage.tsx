import { CATEGORIES, getCategoryName } from '../data/categories';
import { PRODUCTS, filterByCategory, searchProducts, type CategoryId } from '../data/products';
import { useI18n } from '../i18n/I18nProvider';
import { Link, useQuery, useRouter } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { SearchBox } from '../components/SearchBox';

export function ShopPage() {
  const { t, locale } = useI18n();
  const query = useQuery();
  const { navigate } = useRouter();
  const rawQuery = query.get('q') ?? '';
  const rawCategory = query.get('category') ?? 'all';
  const validCategory = CATEGORIES.some((category) => category.id === rawCategory)
    ? (rawCategory as CategoryId)
    : 'all';

  const categoryProducts = filterByCategory(PRODUCTS, validCategory);
  const results = searchProducts(rawQuery, categoryProducts);
  const categoryName =
    validCategory === 'all' ? t('common.all') : getCategoryName(validCategory, locale);

  usePageMeta({
    title: rawQuery ? `${t('shop.searchResultsFor', { query: rawQuery })}` : t('seo.shopTitle'),
    description: t('seo.shopDescription'),
    path: '/shop',
    locale,
  });

  const buildLink = (category: string) => {
    const params = new URLSearchParams();
    if (rawQuery) params.set('q', rawQuery);
    if (category !== 'all') params.set('category', category);
    const search = params.toString();
    return search ? `/shop?${search}` : '/shop';
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t('nav.shop')}</span>
          <h1>{t('shop.title')}</h1>
          <p>{t('shop.subtitle')}</p>
        </div>
      </section>

      <section className="section section--flush-top">
        <div className="container">
          <div className="shop-toolbar">
            <SearchBox
              initialValue={rawQuery}
              inputId="shop-search"
              compact
              onSubmit={(value) => {
                const params = new URLSearchParams();
                if (value) params.set('q', value);
                if (validCategory !== 'all') params.set('category', validCategory);
                navigate(params.toString() ? `/shop?${params.toString()}` : '/shop');
              }}
            />

            <div className="filter-chips" role="group" aria-label={t('shop.filters')}>
              <Link
                to={buildLink('all')}
                className={`filter-chip${validCategory === 'all' ? ' is-active' : ''}`}
                aria-current={validCategory === 'all' ? 'true' : undefined}
              >
                {t('common.all')}
                <span>{PRODUCTS.length}</span>
              </Link>
              {CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  to={buildLink(category.id)}
                  className={`filter-chip${validCategory === category.id ? ' is-active' : ''}`}
                  aria-current={validCategory === category.id ? 'true' : undefined}
                >
                  {getCategoryName(category.id, locale)}
                  <span>{PRODUCTS.filter((product) => product.category === category.id).length}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="results-bar">
            <p className="results-bar__count">
              {t('shop.results', { count: results.length })}
              {rawQuery && (
                <>
                  {' '}
                  <span>· {t('shop.searchResultsFor', { query: rawQuery })}</span>
                </>
              )}
            </p>
            <p className="results-bar__filter">{categoryName}</p>
            {(rawQuery || validCategory !== 'all') && (
              <Link to="/shop" className="text-link">
                <Icon name="close" size={15} />
                {t('shop.reset')}
              </Link>
            )}
          </div>

          {results.length > 0 ? (
            <div className="product-grid">
              {results.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon">
                <Icon name="search" size={28} />
              </span>
              <h2>{t('shop.emptyTitle')}</h2>
              <p>{t('shop.emptyText')}</p>
              <Link to="/shop" className="btn btn--primary">
                {t('shop.reset')}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
