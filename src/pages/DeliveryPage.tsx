import { useState } from 'react';
import { SHIPPING_RATES_ARE_EXAMPLES, WILAYAS } from '../config/shipping';
import { normalizeSearch } from '../data/products';
import { useI18n } from '../i18n/I18nProvider';
import { formatPrice } from '../lib/format';
import { Link } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { Icon } from '../components/Icon';

export function DeliveryPage() {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState('');
  const needle = normalizeSearch(filter);
  const wilayas = WILAYAS.filter((wilaya) => {
    if (!needle) return true;
    return normalizeSearch(`${wilaya.code} ${wilaya.nameFr} ${wilaya.nameAr}`).includes(needle);
  });

  usePageMeta({
    title: t('seo.deliveryTitle'),
    description: t('seo.deliveryDescription'),
    path: '/delivery',
    locale,
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t('nav.delivery')}</span>
          <h1>{t('delivery.title')}</h1>
          <p>{t('delivery.subtitle')}</p>
          {SHIPPING_RATES_ARE_EXAMPLES && (
            <span className="badge badge--example badge--lg">{t('delivery.exampleBadge')}</span>
          )}
        </div>
      </section>

      <section className="section section--flush-top">
        <div className="container">
          {SHIPPING_RATES_ARE_EXAMPLES && (
            <div className="notice notice--warn">
              <Icon name="alert" size={20} />
              <div>
                <strong>{t('delivery.noticeTitle')}</strong>
                <p>{t('delivery.noticeText')}</p>
              </div>
            </div>
          )}

          <div className="rates-toolbar">
            <div className="field field--search">
              <label className="visually-hidden" htmlFor="wilaya-filter">
                {t('delivery.filterLabel')}
              </label>
              <Icon name="search" size={18} className="field__icon" />
              <input
                id="wilaya-filter"
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={t('delivery.filterPlaceholder')}
              />
            </div>
            <p className="rates-count">{t('delivery.count', { count: wilayas.length })}</p>
          </div>

          <div className="rates-table-wrap">
            <table className="rates-table">
              <caption className="visually-hidden">{t('delivery.title')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('delivery.tableWilaya')}</th>
                  <th scope="col">{t('delivery.tableHome')}</th>
                  <th scope="col">{t('delivery.tableDesk')}</th>
                </tr>
              </thead>
              <tbody>
                {wilayas.map((wilaya) => (
                  <tr key={wilaya.code}>
                    <th scope="row">
                      <span className="rates-code">{wilaya.code}</span>
                      {locale === 'ar' ? wilaya.nameAr : wilaya.nameFr}
                    </th>
                    <td>
                      {wilaya.homeDeliveryPrice === null ? (
                        <span className="rates-missing">{t('delivery.notConfigured')}</span>
                      ) : (
                        <>
                          {formatPrice(wilaya.homeDeliveryPrice, locale)}
                          {SHIPPING_RATES_ARE_EXAMPLES && (
                            <span className="rates-example">{t('common.exampleRate')}</span>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      {wilaya.deskDeliveryPrice === null ? (
                        <span className="rates-missing">{t('delivery.notConfigured')}</span>
                      ) : (
                        <>
                          {formatPrice(wilaya.deskDeliveryPrice, locale)}
                          {SHIPPING_RATES_ARE_EXAMPLES && (
                            <span className="rates-example">{t('common.exampleRate')}</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {wilayas.length === 0 && <p className="rates-empty">{t('delivery.noResults')}</p>}
          </div>

          <div className="delivery-help">
            <div>
              <h2>{t('delivery.helpTitle')}</h2>
              <p>{t('delivery.helpText')}</p>
            </div>
            <Link to="/shop" className="btn btn--primary">
              {t('delivery.cta')}
              <Icon name="arrow-right" size={17} className="directional-icon" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
