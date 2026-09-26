import Button from './Button.jsx';
import Icon from './Icon.jsx';

export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-12 text-sm text-muted ${className}`} role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, icon = 'box', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <span className="mb-3 rounded-full border border-border bg-surface-2 p-3 text-muted">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-text-strong">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`} role="alert">
      <span className="mb-3 rounded-full border border-danger/30 bg-danger/10 p-3 text-danger">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-text-strong">Could not load data</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{error?.message ?? String(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon="refresh" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Inline alert box for form-level errors or warnings. */
export function Alert({ tone = 'danger', children, className = '' }) {
  const tones = {
    danger: 'border-danger/40 bg-danger/10 text-danger',
    warning: 'border-warning/40 bg-warning/10 text-warning',
    info: 'border-info/40 bg-info/10 text-info',
    success: 'border-success/40 bg-success/10 text-success',
  };
  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${tones[tone]} ${className}`} role="alert">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
