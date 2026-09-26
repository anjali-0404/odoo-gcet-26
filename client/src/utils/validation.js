// Client-side checks mirroring the backend rules in docs/API.md (the server re-validates).

export function validateLoginId(value) {
  if (!value?.trim()) return 'Login ID is required';
  if (value.trim().length < 6 || value.trim().length > 12) return 'Login ID must be 6-12 characters';
  if (!/^[A-Za-z0-9._-]+$/.test(value.trim())) {
    return 'Login ID may only contain letters, numbers, dot, underscore and hyphen';
  }
  return null;
}

export function validateEmail(value) {
  if (!value?.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length <= 8) return 'Password must be more than 8 characters';
  if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must contain a special character';
  return null;
}

export const required = (label) => (value) =>
  value === undefined || value === null || String(value).trim() === '' ? `${label} is required` : null;

/** Runs { field: validatorFn } against values; returns { field: message } for failures. */
export function runValidators(values, validators) {
  const errors = {};
  for (const [field, check] of Object.entries(validators)) {
    const message = check(values[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Maps the API's `errors: [{ field, message }]` onto a field-error object. */
export function apiFieldErrors(error) {
  const out = {};
  for (const e of error?.errors ?? []) if (!out[e.field]) out[e.field] = e.message;
  return out;
}
