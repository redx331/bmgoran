import { useEffect, useState } from 'react';
import { SITE } from '../config/business';
import { useI18n } from '../i18n/I18nProvider';
import { Link, useRouter } from '../lib/router';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchBox } from './SearchBox';

const NAV_ITEMS = [
  { to: '/', key: 'nav.home' },
  { to: '/shop', key: 'nav.shop' },
  { to: '/delivery', key: 'nav.delivery' },
  { to: '/contact', key: 'nav.contact' },
] as const;

export function Header() {
  const { t, locale } = useI18n();
  const { path } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const isActive = (to: string) => {
    if (to === '/') return path === '/';
    if (to === '/shop') {
      return path === '/shop' || path.startsWith('/product/') || path.startsWith('/checkout/');
    }
    return path === to;
  };

  return (
    <header className="site-header">
      <div className="container header-main">
        <Link to="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            {SITE.brandMark}
          </span>
          <span className="brand__text">
            <span className="brand__name">
              {locale === 'ar' ? SITE.businessNameAr : SITE.businessName}
            </span>
            <span className="brand__tagline">{t('header.tagline')}</span>
          </span>
        </Link>

        <nav className="header-nav" aria-label={t('nav.main')}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`header-nav__link${isActive(item.to) ? ' is-active' : ''}`}
              aria-current={isActive(item.to) ? 'page' : undefined}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="header-search">
          <SearchBox />
        </div>

        <div className="header-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="icon-button header-menu-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      <div className="container header-mobile-search">
        <SearchBox inputId="mobile-header-search" />
      </div>

      {menuOpen && (
        <div className="container mobile-nav" id="mobile-nav">
          <nav aria-label={t('nav.main')}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`mobile-nav__link${isActive(item.to) ? ' is-active' : ''}`}
                aria-current={isActive(item.to) ? 'page' : undefined}
              >
                <span>{t(item.key)}</span>
                <Icon name="arrow-right" size={18} className="directional-icon" />
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
