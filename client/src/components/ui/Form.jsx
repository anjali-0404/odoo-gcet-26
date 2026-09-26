/** <Form onSubmit={fn}> prevents the default browser submit and calls fn(event). */
export default function Form({ onSubmit, className = '', children, ...props }) {
  return (
    <form
      noValidate
      className={`space-y-4 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      {...props}
    >
      {children}
    </form>
  );
}

/** Label + control + error/hint. Used by Input, Select and Textarea. */
export function FormField({ label, htmlFor, required, error, hint, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted">
          {label}
          {required && <span className="ml-0.5 text-accent">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

/** Responsive two-column grid for form fields. */
export function FormGrid({ className = '', children }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>;
}

export function FormActions({ className = '', children }) {
  return <div className={`flex flex-wrap items-center justify-end gap-2 pt-2 ${className}`}>{children}</div>;
}

export const controlClass = (error) =>
  `block w-full rounded-md border bg-surface-2 px-3 py-2 text-sm text-text-strong placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none disabled:opacity-60 ${
    error ? 'border-danger/70' : 'border-border'
  }`;
