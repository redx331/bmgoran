import { useMemo, useState, type FormEvent } from 'react';
import { WILAYAS } from '../config/shipping';
import { getCategoryName } from '../data/categories';
import { getCommunesForWilaya, formatCommuneName } from '../data/communes';
import {
  getProductBySlug,
  getProductName,
  type Product,
} from '../data/products';
import { useI18n } from '../i18n/I18nProvider';
import { formatPrice } from '../lib/format';
import {
  calculateTotals,
  getFieldError,
  normalizeQuantity,
  submitOrder,
  validateOrderFields,
  type OrderFormValues,
  type ValidationError,
  type ValidationField,
} from '../lib/order';
import {
  getShippingQuote,
  type DeliveryMethod,
  type ShippingResult,
} from '../lib/shipping';
import { Link, useQuery } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import { Icon } from '../components/Icon';
import { QuantityStepper } from '../components/QuantityStepper';
import { StockBadge } from '../components/StockBadge';

const FIELD_IDS: Partial<Record<ValidationField, string>> = {
  name: 'checkout-name',
  phone: 'checkout-phone',
  wilaya: 'checkout-wilaya',
  delivery: 'checkout-delivery-home',
  quantity: 'checkout-quantity',
};

function FieldError({ error, id }: { error?: ValidationError; id: string }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <p className="field-error" id={id} role="alert">
      <Icon name="alert" size={14} />
      {t(error.key, error.vars)}
    </p>
  );
}

export function CheckoutPage({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const query = useQuery();
  const product: Product | undefined = getProductBySlug(slug);

  const initialQuantity = normalizeQuantity(query.get('qty') ?? '') ?? 1;
  const [quantity, setQuantity] = useState(initialQuantity);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState('');
  const [commune, setCommune] = useState('');
  const [customCommune, setCustomCommune] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [attempted, setAttempted] = useState(false);
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const productName = product ? getProductName(product, locale) : '';
  const available = product ? product.stockStatus !== 'out_of_stock' : false;

  const shipping: ShippingResult | null =
    wilayaCode && deliveryMethod ? getShippingQuote(wilayaCode, deliveryMethod) : null;
  const validQuantity = normalizeQuantity(quantity);
  const subtotal = product && validQuantity ? product.price * validQuantity : null;
  const totals =
    product && validQuantity !== null && shipping?.ok
      ? calculateTotals(product.price, validQuantity, shipping.quote.amount)
      : null;

  const availableCommunes = useMemo(
    () => (wilayaCode ? getCommunesForWilaya(wilayaCode) : []),
    [wilayaCode],
  );
  const resolvedCommune = commune === '__other__' ? customCommune.trim() : commune;

  const values: OrderFormValues = {
    name,
    phone,
    wilayaCode,
    commune: resolvedCommune,
    deliveryMethod,
    quantity,
  };
  const errors = attempted
    ? validateOrderFields(values, { product, shipping })
    : [];

  usePageMeta({
    title: product ? `${t('checkout.title')} — ${productName}` : t('checkout.title'),
    description: t('checkout.subtitle'),
    path: `/checkout/${slug}`,
    locale,
    noindex: true,
  });

  const nameError = getFieldError(errors, 'name');
  const phoneError = getFieldError(errors, 'phone');
  const wilayaError = getFieldError(errors, 'wilaya');
  const deliveryError = getFieldError(errors, 'delivery');
  const quantityError = getFieldError(errors, 'quantity');

  const handleWilayaChange = (code: string) => {
    setWilayaCode(code);
    setCommune('');
    setCustomCommune('');
    // Skip the delivery choice when this wilaya only offers the other method.
    if (code && !getShippingQuote(code, deliveryMethod).ok) {
      const other = deliveryMethod === 'home' ? 'desk' : 'home';
      if (getShippingQuote(code, other).ok) setDeliveryMethod(other);
    }
  };

  const methodQuote = (method: DeliveryMethod) => {
    if (!wilayaCode) return null;
    return getShippingQuote(wilayaCode, method);
  };

  const rateBlocked = shipping !== null && !shipping.ok;
  const exampleRate = shipping !== null && shipping.ok && shipping.quote.isExample;
  const submitDisabled = rateBlocked || exampleRate || sending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    setSendFailed(false);

    const currentShipping =
      wilayaCode && deliveryMethod ? getShippingQuote(wilayaCode, deliveryMethod) : null;
    const currentErrors = validateOrderFields(values, {
      product,
      shipping: currentShipping,
    });

    if (currentErrors.length > 0) {
      const first = currentErrors.find((error) => error.field !== 'form');
      const targetId = first ? FIELD_IDS[first.field] : undefined;
      if (targetId) document.getElementById(targetId)?.focus();
      return;
    }

    if (!product || !available || !currentShipping?.ok || validQuantity === null) return;

    setSending(true);
    try {
      setReference(
        await submitOrder({
          productSlug: product.slug,
          quantity: validQuantity,
          name,
          phone,
          wilayaCode,
          commune: resolvedCommune,
          deliveryMethod: currentShipping.quote.method,
          website,
        }),
      );
      window.scrollTo({ top: 0 });
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  };

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <span className="empty-state__icon">
              <Icon name="alert" size={28} />
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

  if (!available) {
    return (
      <section className="section">
        <div className="container container--narrow">
          <div className="checkout-unavailable">
            <span className="empty-state__icon">
              <Icon name="alert" size={28} />
            </span>
            <StockBadge status={product.stockStatus} />
            <h1>{t('checkout.unavailableProductTitle')}</h1>
            <p>{t('checkout.unavailableProductText')}</p>
            <div className="unavailable-product">
              <img
                src={product.images[0] ?? '/images/products/placeholder.svg'}
                alt={t('checkout.productImageAlt', { name: productName })}
                width={800}
                height={600}
              />
              <div>
                <strong>{productName}</strong>
                <span>{formatPrice(product.price, locale)}</span>
              </div>
            </div>
            <div className="empty-state__actions">
              <Link to="/shop" className="btn btn--primary">
                {t('checkout.unavailableProductCta')}
              </Link>
              <Link to={`/product/${product.slug}`} className="btn btn--ghost">
                {t('checkout.backToProduct')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reference) {
    return (
      <section className="section section--checkout">
        <div className="container container--narrow">
          <div className="order-success" id="order-ready" role="status" aria-live="polite">
            <div className="order-success__icon">
              <Icon name="check" size={24} />
            </div>
            <div className="order-success__body">
              <h1>{t('checkout.successTitle')}</h1>
              <p>{t('checkout.successText')}</p>
              <p className="order-success__ref">
                <span>{t('checkout.reference')}</span>
                <code>{reference}</code>
              </p>
              <p className="order-success__hint">{t('checkout.referenceHint')}</p>
              <div className="order-success__actions">
                <Link to="/shop" className="btn btn--primary btn--sm">
                  {t('product.backToShop')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const formErrorKeys = [...new Set(errors.filter((error) => error.field === 'form').map((error) => error.key))];

  return (
    <section className="section section--checkout">
      <div className="container">
        <div className="checkout-heading">
          <Link to={`/product/${product.slug}`} className="text-link">
            <Icon name="arrow-left" size={16} className="directional-icon" />
            {t('checkout.backToProduct')}
          </Link>
          <h1>{t('checkout.title')}</h1>
          <p>{t('checkout.subtitle')}</p>
          <p className="required-note">{t('checkout.requiredNote')}</p>
        </div>

        <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="checkout-website">Website</label>
            <input
              id="checkout-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <div className="checkout-form">
            {attempted && errors.length > 0 && (
              <div className="notice notice--error" role="alert">
                <Icon name="alert" size={20} />
                <div>
                  <strong>{t('checkout.validationSummary')}</strong>
                  {formErrorKeys.length > 0 && (
                    <ul className="error-list">
                      {formErrorKeys.map((key) => (
                        <li key={key}>{t(key)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <fieldset className="form-section">
              <legend>
                <span className="form-section__number">01</span>
                {t('checkout.contactSection')}
              </legend>
              <div className="form-grid">
                <div className={`field field--full${nameError ? ' is-invalid' : ''}`}>
                  <label htmlFor="checkout-name">
                    {t('checkout.name')} <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t('checkout.namePlaceholder')}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? 'checkout-name-error' : undefined}
                  />
                  <FieldError error={nameError} id="checkout-name-error" />
                </div>

                <div className={`field field--full${phoneError ? ' is-invalid' : ''}`}>
                  <label htmlFor="checkout-phone">
                    {t('checkout.phone')} <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder={t('checkout.phonePlaceholder')}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={`checkout-phone-hint${phoneError ? ' checkout-phone-error' : ''}`}
                  />
                  <p className="field-hint" id="checkout-phone-hint">
                    {t('checkout.phoneHint')}
                  </p>
                  <FieldError error={phoneError} id="checkout-phone-error" />
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend>
                <span className="form-section__number">02</span>
                {t('checkout.deliverySection')}
              </legend>

              <div className={`field${wilayaError ? ' is-invalid' : ''}`}>
                <label htmlFor="checkout-wilaya">
                  {t('checkout.wilaya')} <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <select
                  id="checkout-wilaya"
                  name="wilaya"
                  value={wilayaCode}
                  onChange={(event) => handleWilayaChange(event.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(wilayaError)}
                  aria-describedby={wilayaError ? 'checkout-wilaya-error' : undefined}
                >
                  <option value="">{t('checkout.wilayaPlaceholder')}</option>
                  {WILAYAS.map((wilaya) => (
                    <option key={wilaya.code} value={wilaya.code}>
                      {wilaya.code} — {locale === 'ar' ? wilaya.nameAr : wilaya.nameFr}
                    </option>
                  ))}
                </select>
                <FieldError error={wilayaError} id="checkout-wilaya-error" />
              </div>

              <div className="field">
                <label htmlFor="checkout-commune">
                  {t('checkout.commune')}
                </label>
                <select
                  id="checkout-commune"
                  name="commune"
                  value={commune}
                  onChange={(event) => setCommune(event.target.value)}
                  disabled={!wilayaCode}
                >
                  <option value="">
                    {wilayaCode
                      ? t('checkout.communePlaceholder')
                      : t('checkout.communeSelectWilayaFirst')}
                  </option>
                  {availableCommunes.map((c) => {
                    const label = formatCommuneName(c, locale);
                    return (
                      <option key={c.nameFr} value={label}>
                        {label}
                      </option>
                    );
                  })}
                  {wilayaCode ? <option value="__other__">{t('checkout.communeOther')}</option> : null}
                </select>
              </div>

              {commune === '__other__' && (
                <div className="field">
                  <label htmlFor="checkout-commune-custom">
                    {t('checkout.communeCustomLabel')}
                  </label>
                  <input
                    id="checkout-commune-custom"
                    type="text"
                    value={customCommune}
                    onChange={(event) => setCustomCommune(event.target.value)}
                    placeholder={t('checkout.communeCustomPlaceholder')}
                    autoComplete="address-level2"
                  />
                </div>
              )}

              <div className={`field${deliveryError ? ' is-invalid' : ''}`}>
                <span className="field-label" id="delivery-label">
                  {t('checkout.deliveryMethod')} <span className="required-mark" aria-hidden="true">*</span>
                </span>
                <div
                  className="delivery-options"
                  role="radiogroup"
                  aria-labelledby="delivery-label"
                  aria-required="true"
                  aria-invalid={Boolean(deliveryError)}
                  aria-describedby={deliveryError ? 'checkout-delivery-error' : undefined}
                >
                  {(['home', 'desk'] as const).map((method) => {
                    const quote = methodQuote(method);
                    const isUnavailable = wilayaCode !== '' && (!quote || !quote.ok);
                    return (
                      <label
                        key={method}
                        className={`delivery-option${deliveryMethod === method ? ' is-selected' : ''}${
                          isUnavailable ? ' is-unavailable' : ''
                        }`}
                      >
                        <input
                          id={`checkout-delivery-${method}`}
                          type="radio"
                          name="deliveryMethod"
                          value={method}
                          checked={deliveryMethod === method}
                          onChange={() => setDeliveryMethod(method)}
                        />
                        <span className="delivery-option__icon" aria-hidden="true">
                          <Icon name={method === 'home' ? 'truck' : 'package'} size={21} />
                        </span>
                        <span className="delivery-option__text">
                          <strong>
                            {method === 'home' ? t('checkout.homeDelivery') : t('checkout.deskDelivery')}
                          </strong>
                          <small>{method === 'home' ? t('checkout.homeHint') : t('checkout.deskHint')}</small>
                        </span>
                        <span className="delivery-option__price">
                          {!wilayaCode
                            ? '—'
                            : quote?.ok
                              ? formatPrice(quote.quote.amount, locale)
                              : t('delivery.notConfigured')}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <FieldError error={deliveryError} id="checkout-delivery-error" />
              </div>

              {rateBlocked && (
                <div className="notice notice--warn" role="alert">
                  <Icon name="alert" size={19} />
                  <div>
                    <p>{t('checkout.rateUnavailable')}</p>
                    <Link to="/contact" className="text-link">
                      {t('common.contactUs')}
                      <Icon name="arrow-right" size={15} className="directional-icon" />
                    </Link>
                  </div>
                </div>
              )}

              {shipping?.ok && shipping.quote.isExample && (
                <div className="notice notice--info">
                  <Icon name="alert" size={19} />
                  <p>{t('checkout.rateExampleNotice')}</p>
                </div>
              )}
            </fieldset>
          </div>

          <aside className="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">{t('checkout.summary')}</h2>

            <div className="summary-product">
              <img
                src={product.images[0] ?? '/images/products/placeholder.svg'}
                alt={t('checkout.productImageAlt', { name: productName })}
                width={800}
                height={600}
                loading="lazy"
              />
              <div className="summary-product__info">
                <span className="summary-product__category">
                  {getCategoryName(product.category, locale)}
                </span>
                <strong>{productName}</strong>
                <span>{formatPrice(product.price, locale)}</span>
              </div>
            </div>

            <div className="summary-quantity">
              <span className="field-label">{t('checkout.quantity')}</span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                inputId="checkout-quantity"
                label={t('checkout.quantity')}
                invalid={Boolean(quantityError)}
                describedBy={quantityError ? 'checkout-quantity-error' : undefined}
              />
            </div>
            {quantityError && <FieldError error={quantityError} id="checkout-quantity-error" />}

            <div className="summary-rows" aria-live="polite">
              <div className="summary-row">
                <span>{t('checkout.subtotal')}</span>
                <span>{subtotal !== null ? formatPrice(subtotal, locale) : '—'}</span>
              </div>
              <div className="summary-row">
                <span>{t('checkout.shipping')}</span>
                <span className="summary-shipping">
                  {!wilayaCode ? (
                    <span className="summary-muted">{t('checkout.selectWilayaToSeeShipping')}</span>
                  ) : shipping?.ok ? (
                    <>
                      {formatPrice(shipping.quote.amount, locale)}
                      {shipping.quote.isExample && (
                        <span className="badge badge--example">{t('checkout.rateExampleBadge')}</span>
                      )}
                    </>
                  ) : (
                    <span className="summary-error">{t('delivery.notConfigured')}</span>
                  )}
                </span>
              </div>
              <div className="summary-row summary-row--total">
                <span>{t('checkout.total')}</span>
                <strong>{totals ? formatPrice(totals.total, locale) : '—'}</strong>
              </div>
            </div>

            {sendFailed && (
              <div className="notice notice--error" role="alert">
                <Icon name="alert" size={19} />
                <p>{t('checkout.sendError')}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={submitDisabled}
            >
              <Icon name="check" size={20} />
              {sending
                ? t('checkout.sending')
                : submitDisabled
                  ? t('checkout.buyButtonDisabled')
                  : t('checkout.buyButton')}
            </button>

            <p className="summary-note">
              <Icon name="phone" size={15} />
              {t('checkout.orderHint')}
            </p>

            <div className="privacy-note">
              <h3>{t('checkout.privacyTitle')}</h3>
              <p>{t('checkout.privacyText')}</p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}
