import { useCallback, useState } from 'react';
import { apiFieldErrors, runValidators } from '../utils/validation.js';

/**
 * Minimal form state:
 *   const form = useForm({ name: '' });
 *   <Input value={form.values.name} onChange={form.setField('name')} error={form.errors.name} />
 *   <Form onSubmit={form.submit({ name: required('Name') }, async (values) => save(values))}>
 * Server validation errors ({ errors: [{ field, message }] }) are mapped onto fields,
 * and the server message is exposed as formError.
 */
export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(
    (name) => (eventOrValue) => {
      const value = eventOrValue?.target
        ? eventOrValue.target.type === 'checkbox'
          ? eventOrValue.target.checked
          : eventOrValue.target.value
        : eventOrValue;
      setValues((v) => ({ ...v, [name]: value }));
      setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
    },
    []
  );

  const submit = (validators, action) => async () => {
    const found = runValidators(values, validators ?? {});
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await action(values);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValues, setField, errors, setErrors, formError, setFormError, submitting, submit };
}
