import { useId } from 'react';
import { controlClass, FormField } from './Form.jsx';

/**
 * <Select options={[{ value, label }]} placeholder="All warehouses" value onChange />
 * `placeholder` renders an empty-value first option.
 */
export default function Select({
  label,
  error,
  hint,
  required,
  options = [],
  placeholder,
  className = '',
  id,
  ...props
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FormField label={label} htmlFor={selectId} required={required} error={error} hint={hint} className={className}>
      <select id={selectId} className={`${controlClass(error)} pr-8`} aria-invalid={Boolean(error)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
