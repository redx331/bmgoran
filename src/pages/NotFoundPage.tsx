import { useI18n } from '../i18n/I18nProvider';
import { Link } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { Icon } from '../components/Icon';

export function NotFoundPage() {
  const { t, locale } = useI18n();

  usePageMeta({
    title: t('notFound.title'),
    description: t('notFound.text'),
    path: '/404',
    locale,
    noindex: true,
  });

  return (
    <section className="section">
      <div className="container">
        <div className="empty-state">
          <span className="empty-state__code" aria-hidden="true">
            404
          </span>
          <h1>{t('notFound.title')}</h1>
          <p>{t('notFound.text')}</p>
          <Link to="/" className="btn btn--primary">
            <Icon name="arrow-left" size={17} className="directional-icon" />
            {t('notFound.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
