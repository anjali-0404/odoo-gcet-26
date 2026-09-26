import { useId } from 'react';
import { controlClass, FormField } from './Form.jsx';

/** Text/number/date/password input with label and error. Extra props go to <input>. */
export default function Input({ label, error, hint, required, className = '', id, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FormField label={label} htmlFor={inputId} required={required} error={error} hint={hint} className={className}>
      <input id={inputId} className={controlClass(error)} aria-invalid={Boolean(error)} {...props} />
    </FormField>
  );
}

export function Textarea({ label, error, hint, required, className = '', id, rows = 3, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FormField label={label} htmlFor={inputId} required={required} error={error} hint={hint} className={className}>
      <textarea id={inputId} rows={rows} className={controlClass(error)} aria-invalid={Boolean(error)} {...props} />
    </FormField>
  );
}
