import { STATUS_META, STOCK_STATUS_META } from '../../utils/constants.js';

const TONES = {
  neutral: 'border-border bg-surface-2 text-text',
  accent: 'border-accent/40 bg-accent-muted text-accent',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-info/30 bg-info/10 text-info',
};

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Operation status: draft | waiting | ready | done | canceled */
export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** Product stock status: in | low | out */
export function StockBadge({ status }) {
  const meta = STOCK_STATUS_META[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export default Badge;
