import { useI18n } from '../i18n/I18nProvider';
import { Icon } from './Icon';
import { MAX_QUANTITY } from '../lib/order';

export function QuantityStepper({
  value,
  onChange,
  max = MAX_QUANTITY,
  min = 1,
  label,
  inputId,
  disabled = false,
  invalid = false,
  describedBy,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  label?: string;
  inputId?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const { t } = useI18n();
  const safeValue = Number.isFinite(value) ? value : 0;

  const setClamped = (next: number) => {
    if (disabled) return;
    onChange(Math.min(max, Math.max(min, Math.floor(next))));
  };

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__button"
        onClick={() => setClamped(safeValue - 1)}
        disabled={disabled || safeValue <= min}
        aria-label={t('product.decrease')}
      >
        <Icon name="minus" size={18} />
      </button>
      <label className="visually-hidden" htmlFor={inputId}>
        {label ?? t('product.quantity')}
      </label>
      <input
        id={inputId}
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={safeValue === 0 ? '' : safeValue}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? 0 : Math.floor(Number(raw)));
        }}
        disabled={disabled}
        aria-label={label ?? t('product.quantity')}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="stepper__button"
        onClick={() => setClamped(safeValue + 1)}
        disabled={disabled || safeValue >= max}
        aria-label={t('product.increase')}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
