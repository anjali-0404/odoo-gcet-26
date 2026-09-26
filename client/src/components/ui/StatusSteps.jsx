import { STATUS_META } from '../../utils/constants.js';

/** "Draft > Ready > Done" status trail from the mockup, highlighting the current status. */
export default function StatusSteps({ steps, current }) {
  if (current === 'canceled') {
    return (
      <span className="rounded-md border border-danger/40 px-3 py-1 text-xs font-medium text-danger">Canceled</span>
    );
  }
  const currentIndex = steps.indexOf(current);
  return (
    <ol className="flex items-center rounded-md border border-accent/60 px-2 py-1 text-xs" aria-label="Status">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center">
          {i > 0 && <span className="px-1.5 text-muted">›</span>}
          <span
            aria-current={step === current ? 'step' : undefined}
            className={
              step === current
                ? 'font-semibold text-accent'
                : i < currentIndex
                  ? 'text-text'
                  : 'text-muted'
            }
          >
            {STATUS_META[step]?.label ?? step}
          </span>
        </li>
      ))}
    </ol>
  );
}
