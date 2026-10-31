import { useI18n } from '../i18n/I18nProvider';
import { hasDemoData } from '../lib/demo';
import { Icon } from './Icon';

export function DemoBar() {
  const { t } = useI18n();
  if (!hasDemoData()) return null;

  return (
    <div className="demo-bar" aria-label={t('a11y.demoBanner')}>
      <div className="container demo-bar__inner">
        <Icon name="alert" size={16} />
        <p>
          <strong>{t('home.demoTitle')}</strong>
          <span> — {t('footer.demoNote')}</span>
        </p>
      </div>
    </div>
  );
}
