import { useI18n } from '../i18n/I18nProvider';
import type { StockStatus } from '../data/products';

const STOCK_KEYS = {
  in_stock: 'stock.in_stock',
  low_stock: 'stock.low_stock',
  out_of_stock: 'stock.out_of_stock',
} as const;

export function StockBadge({ status, className = '' }: { status: StockStatus; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={`stock-badge stock-badge--${status}${className ? ` ${className}` : ''}`}>
      <span className="stock-badge__dot" aria-hidden="true" />
      {t(STOCK_KEYS[status])}
    </span>
  );
}
