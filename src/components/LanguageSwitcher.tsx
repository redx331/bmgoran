import { useI18n } from '../i18n/I18nProvider';
import { LOCALE_LABELS, LOCALE_SHORT } from '../i18n/translations';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t('common.language')}>
      {(['fr', 'ar'] as const).map((code) => (
        <button
          key={code}
          type="button"
          className="lang-switch__button"
          aria-pressed={locale === code}
          aria-label={LOCALE_LABELS[code]}
          title={LOCALE_LABELS[code]}
          lang={code}
          onClick={() => setLocale(code)}
        >
          <span className="lang-switch__full">{LOCALE_LABELS[code]}</span>
          <span className="lang-switch__short" aria-hidden="true">
            {LOCALE_SHORT[code]}
          </span>
        </button>
      ))}
    </div>
  );
}
