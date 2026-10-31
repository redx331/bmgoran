import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { DemoBar } from './DemoBar';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('nav.skipToContent')}
      </a>
      <DemoBar />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
