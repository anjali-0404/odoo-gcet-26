const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const qtyFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 });
const moneyFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? dateTimeFmt.format(new Date(value)) : '—');
export const formatQty = (value) => (value === null || value === undefined ? '—' : qtyFmt.format(value));
export const formatMoney = (value) => (value === null || value === undefined ? '—' : moneyFmt.format(value));

/** Date -> "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "[DESK001] Desk" style label used across the mockup. */
export const productLabel = (p) => (p ? `[${p.sku}] ${p.name}` : '—');

/** Signed quantity, e.g. "+20" / "-3". */
export const signedQty = (n) => `${n > 0 ? '+' : ''}${formatQty(n)}`;

/** True when a scheduled date is before today (used for "Late" highlighting). */
export function isLate(scheduledDate, status) {
  if (!scheduledDate || !['draft', 'waiting', 'ready'].includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(scheduledDate) < today;
}
