import { buildWhatsAppUrl, getWhatsAppStatus, SITE } from '../config/business';
import { useI18n } from '../i18n/I18nProvider';
import { usePageMeta } from '../lib/seo';
import { Icon } from '../components/Icon';

export function ContactPage() {
  const { t, locale } = useI18n();
  const whatsapp = getWhatsAppStatus();
  const isAr = locale === 'ar';
  const whatsappUrl = whatsapp.configured
    ? buildWhatsAppUrl(
        whatsapp.number,
        isAr ? 'مرحبًا، لدي سؤال حول قطعة غيار.' : 'Bonjour, j’ai une question sur une pièce.',
      )
    : null;

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
            <div className="contact-card">
              <span className="contact-card__icon">
                <Icon name="whatsapp" size={24} />
              </span>
              <h2>{t('contact.whatsapp')}</h2>
              {whatsappUrl ? (
                <>
                  <p>{isAr ? 'أسرع طريقة للتواصل معنا.' : 'Le moyen le plus rapide de nous joindre.'}</p>
                  <a
                    className="btn btn--whatsapp btn--sm"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('contact.whatsappCta')}
                    <Icon name="arrow-right" size={16} className="directional-icon" />
                    <span className="visually-hidden">({t('a11y.external')})</span>
                  </a>
                </>
              ) : (
                <p className="contact-missing">{t('contact.whatsappMissing')}</p>
              )}
            </div>

            <div className="contact-card">
              <span className="contact-card__icon">
                <Icon name="phone" size={24} />
              </span>
              <h2>{t('contact.phone')}</h2>
              {SITE.phoneHref ? (
                <a href={SITE.phoneHref} dir="ltr">
                  {SITE.phoneDisplay}
                </a>
              ) : (
                <>
                  <p className="contact-placeholder" dir="ltr">
                    {SITE.phoneDisplay}
                  </p>
                  <p className="contact-missing">{t('contact.phoneMissing')}</p>
                </>
              )}
            </div>

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
              <Icon name="whatsapp" size={26} />
              <h2>{SITE.businessName}</h2>
              <address>
                {isAr ? SITE.addressAr : SITE.addressFr}
                <br />
                {isAr ? SITE.cityAr : SITE.cityFr}
              </address>
              <p className="contact-panel__email">
                <Icon name="mail" size={15} />
                <a href={`mailto:${SITE.email}`} dir="ltr">
                  {SITE.email}
                </a>
              </p>
              {SITE.demoContact && (
                <p className="contact-demo">{t('contact.demoNote')}</p>
              )}
            </div>

            <div className="privacy-panel" id="privacy">
              <h2>{t('contact.privacyTitle')}</h2>
              <p>{t('contact.privacyText')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
