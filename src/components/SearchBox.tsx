import { useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useRouter } from '../lib/router';
import { Icon } from './Icon';

export function SearchBox({
  initialValue = '',
  inputId = 'header-search',
  compact = false,
  onSubmit,
}: {
  initialValue?: string;
  inputId?: string;
  compact?: boolean;
  onSubmit?: (query: string) => void;
}) {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (onSubmit) {
      onSubmit(query);
      return;
    }
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
  };

  return (
    <form className={`search-box${compact ? ' search-box--compact' : ''}`} role="search" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor={inputId}>
        {t('header.searchLabel')}
      </label>
      <Icon name="search" size={19} className="search-box__icon" />
      <input
        id={inputId}
        type="search"
        className="search-box__input"
        placeholder={t('header.searchPlaceholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />
      <button type="submit" className="search-box__button" aria-label={t('common.search')}>
        {t('common.search')}
      </button>
    </form>
  );
}
