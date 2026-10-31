import { getCategoryName, CATEGORIES } from '../data/categories';
import { PRODUCTS, getProductName, type Product } from '../data/products';
import { buildWhatsAppUrl, getWhatsAppStatus } from '../config/business';
import { useI18n } from '../i18n/I18nProvider';
import { formatPrice } from '../lib/format';
import { Link } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { Icon, type IconName } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';

const CATEGORY_ICONS: Record<string, IconName> = {
  'car-parts': 'engine',
  'motorcycle-parts': 'moto',
  'universal-accessories': 'accessory',
  'vehicle-specific-parts': 'fitment',
};

function countInCategory(category: string): number {
  return PRODUCTS.filter((product) => product.category === category).length;
}

export function HomePage() {
  const { t, locale } = useI18n();
  const whatsapp = getWhatsAppStatus();
  const featured = PRODUCTS.filter((product) => product.featured).slice(0, 4);
  const heroProduct: Product | undefined = featured[0] ?? PRODUCTS[0];

  usePageMeta({
    title: t('seo.homeTitle'),
    description: t('seo.homeDescription'),
    path: '/',
    locale,
  });

  const whatsappUrl = whatsapp.configured
    ? buildWhatsAppUrl(
        whatsapp.number,
        locale === 'ar'
          ? 'مرحبًا، لدي سؤال حول قطعة غيار.'
          : 'Bonjour, j’ai une question sur une pièce.',
      )
    : null;

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <span className="eyebrow">{t('home.eyebrow')}</span>
            <h1 className="hero__title">
              {t('home.heroTitle')}
              <br />
              <span>{t('home.heroAccent')}</span>
            </h1>
            <p className="hero__text">{t('home.heroText')}</p>
            <div className="hero__actions">
              <Link to="/shop" className="btn btn--primary">
                {t('home.heroCta')}
                <Icon name="arrow-right" size={18} className="directional-icon" />
              </Link>
              <Link to="/delivery" className="btn btn--ghost">
                <Icon name="truck" size={18} />
                {t('nav.delivery')}
              </Link>
            </div>
            <p className="hero__note">
              <Icon name="shield" size={16} />
              {t('home.heroNote')}
            </p>
          </div>

          {heroProduct && (
            <Link to={`/product/${heroProduct.slug}`} className="hero__visual">
              <img
                src={heroProduct.images[0] ?? '/images/products/placeholder.svg'}
                alt=""
                width={800}
                height={600}
                fetchPriority="high"
                decoding="async"
              />
              <span className="hero__visual-badge">{t('home.featuredBadge')}</span>
              <span className="hero__price-card">
                <span className="hero__price-label">{getProductName(heroProduct, locale)}</span>
                <span className="hero__price">{formatPrice(heroProduct.price, locale)}</span>
                <span className="hero__price-demo">{t('common.demoPriceShort')}</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="home-categories-title">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('nav.shop')}</span>
              <h2 id="home-categories-title">{t('home.categoriesTitle')}</h2>
              <p>{t('home.categoriesSubtitle')}</p>
            </div>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.id}`}
                className="category-card"
              >
                <span className="category-card__icon">
                  <Icon name={CATEGORY_ICONS[category.id] ?? 'package'} size={26} />
                </span>
                <span className="category-card__body">
                  <span className="category-card__name">{getCategoryName(category.id, locale)}</span>
                  <span className="category-card__desc">
                    {locale === 'ar' ? category.descriptionAr : category.descriptionFr}
                  </span>
                  <span className="category-card__count">
                    {t('home.categoryCount', { count: countInCategory(category.id) })}
                  </span>
                </span>
                <Icon name="arrow-right" size={18} className="category-card__arrow directional-icon" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="home-featured-title">
        <div className="container">
          <div className="section-heading section-heading--row">
            <div>
              <span className="eyebrow">{t('home.featuredBadge')}</span>
              <h2 id="home-featured-title">{t('home.featuredTitle')}</h2>
              <p>{t('home.featuredSubtitle')}</p>
            </div>
            <Link to="/shop" className="text-link">
              {t('home.viewAll')}
              <Icon name="arrow-right" size={16} className="directional-icon" />
            </Link>
          </div>

          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-label={t('home.stepsTitle')}>
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('common.buyNow')}</span>
              <h2>{t('home.stepsTitle')}</h2>
              <p>{t('home.stepsSubtitle')}</p>
            </div>
          </div>
          <ol className="steps">
            {[
              { title: t('home.step1Title'), text: t('home.step1Text'), icon: 'search' as IconName },
              { title: t('home.step2Title'), text: t('home.step2Text'), icon: 'package' as IconName },
              { title: t('home.step3Title'), text: t('home.step3Text'), icon: 'whatsapp' as IconName },
            ].map((step, index) => (
              <li className="step" key={step.title}>
                <span className="step__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="step__icon">
                  <Icon name={step.icon} size={22} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <Icon name="shield" size={22} />
              <div>
                <h3>{t('home.trust1Title')}</h3>
                <p>{t('home.trust1Text')}</p>
              </div>
            </div>
            <div className="trust-item">
              <Icon name="truck" size={22} />
              <div>
                <h3>{t('home.trust2Title')}</h3>
                <p>{t('home.trust2Text')}</p>
              </div>
            </div>
            <div className="trust-item">
              <Icon name="whatsapp" size={22} />
              <div>
                <h3>{t('home.trust3Title')}</h3>
                <p>{t('home.trust3Text')}</p>
              </div>
            </div>
          </div>

          <div className="notice notice--demo">
            <Icon name="alert" size={20} />
            <div>
              <strong>{t('home.demoTitle')}</strong>
              <p>{t('home.demoText')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-band">
            <div>
              <span className="eyebrow">{t('common.contactUs')}</span>
              <h2>{t('home.contactTitle')}</h2>
              <p>{t('home.contactText')}</p>
            </div>
            {whatsappUrl ? (
              <a className="btn btn--whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={19} />
                {t('home.contactCta')}
                <span className="visually-hidden">({t('a11y.external')})</span>
              </a>
            ) : (
              <Link to="/contact" className="btn btn--primary">
                <Icon name="phone" size={18} />
                {t('home.contactCta')}
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
