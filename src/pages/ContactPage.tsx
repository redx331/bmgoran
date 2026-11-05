import { SITE } from '../config/business';
import { useI18n } from '../i18n/I18nProvider';
import { usePageMeta } from '../lib/seo';
import { Icon } from '../components/Icon';

export function ContactPage() {
  const { t, locale } = useI18n();
  const isAr = locale === 'ar';

  usePageMeta({
    title: t('seo.contactTitle'),
    description: t('seo.contactDescription'),
    path: '/contact',
    locale,
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t('nav.contact')}</span>
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>
      </section>

      <section className="section section--flush-top">
        <div className="container contact-layout">
          <div className="contact-cards">
            {SITE.phoneHref && (
              <div className="contact-card">
                <span className="contact-card__icon">
                  <Icon name="phone" size={24} />
                </span>
                <h2>{t('contact.phone')}</h2>
                <a href={SITE.phoneHref} dir="ltr">
                  {SITE.phoneDisplay}
                </a>
              </div>
            )}

            <div className="contact-card">
              <span className="contact-card__icon">
                <Icon name="pin" size={24} />
              </span>
              <h2>{t('contact.address')}</h2>
              <p>{isAr ? SITE.addressAr : SITE.addressFr}</p>
              <p>{isAr ? SITE.cityAr : SITE.cityFr}</p>
            </div>

            <div className="contact-card">
              <span className="contact-card__icon">
                <Icon name="clock" size={24} />
              </span>
              <h2>{t('contact.hours')}</h2>
              <p>{isAr ? SITE.openingHoursAr : SITE.openingHoursFr}</p>
            </div>

            {(SITE.facebookUrl || SITE.instagramUrl) && (
              <div className="contact-card">
                <span className="contact-card__icon">
                  <Icon name="globe" size={24} />
                </span>
                <h2>{t('contact.social')}</h2>
                {SITE.facebookUrl && (
                  <a href={SITE.facebookUrl} target="_blank" rel="noopener noreferrer">
                    Facebook
                  </a>
                )}
                {SITE.instagramUrl && (
                  <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="contact-side">
            <div className="contact-panel">
              <Icon name="pin" size={26} />
              <h2>{SITE.businessName}</h2>
              <address>
                {isAr ? SITE.addressAr : SITE.addressFr}
                <br />
                {isAr ? SITE.cityAr : SITE.cityFr}
              </address>
              {SITE.demoContact && (
                <p className="contact-demo">{t('contact.demoNote')}</p>
              )}
            </div>

            <div className="privacy-panel" id="privacy">
              <h2>{t('contact.privacyTitle')}</h2>
              <p>{t('contact.privacyText')}</p>
              {SITE.metaPixelId && <p>{t('privacy.pixelNotice')}</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
