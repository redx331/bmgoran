import { SITE } from '../config/business';
import { CATEGORIES, getCategoryName } from '../data/categories';
import { useI18n } from '../i18n/I18nProvider';
import { Link } from '../lib/router';
import { hasDemoData } from '../lib/demo';
import { Icon } from './Icon';

export function Footer() {
  const { t, locale } = useI18n();
  const businessName = locale === 'ar' ? SITE.businessNameAr : SITE.businessName;
  const address = locale === 'ar' ? SITE.addressAr : SITE.addressFr;
  const hours = locale === 'ar' ? SITE.openingHoursAr : SITE.openingHoursFr;

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand brand--footer">
            <span className="brand__mark" aria-hidden="true">
              {SITE.brandMark}
            </span>
            <span className="brand__text">
              <span className="brand__name">{businessName}</span>
              <span className="brand__tagline">{t('header.tagline')}</span>
            </span>
          </Link>
          <p>{t('footer.about')}</p>
          {hasDemoData() && (
            <p className="footer-demo-tag">
              <Icon name="alert" size={15} />
              {t('footer.demoNote')}
            </p>
          )}
        </div>

        <div className="footer-column">
          <h2>{t('footer.shop')}</h2>
          <Link to="/shop">{t('footer.allProducts')}</Link>
          {CATEGORIES.map((category) => (
            <Link key={category.id} to={`/shop?category=${category.id}`}>
              {getCategoryName(category.id, locale)}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h2>{t('footer.info')}</h2>
          <Link to="/delivery">{t('footer.deliveryRates')}</Link>
          <Link to="/contact">{t('nav.contact')}</Link>
          <Link to="/contact">{t('footer.privacy')}</Link>
          <Link to="/shop">{t('footer.order')}</Link>
        </div>

        <div className="footer-column footer-contact">
          <h2>{t('footer.contact')}</h2>
          <p>
            <Icon name="pin" size={16} />
            <span>
              {address}
              <br />
              {locale === 'ar' ? SITE.cityAr : SITE.cityFr}
            </span>
          </p>
          {SITE.phoneHref && (
            <p>
              <Icon name="phone" size={16} />
              <span dir="ltr">{SITE.phoneDisplay}</span>
            </p>
          )}
          <p>
            <Icon name="clock" size={16} />
            <span>{hours}</span>
          </p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} {businessName}. {t('footer.rights')}
        </p>
        <p>
          <Link to="/admin" className="footer-admin-link">Administration</Link>
          {' · '}
          {t('footer.noDatabase')}
        </p>
      </div>
    </footer>
  );
}
