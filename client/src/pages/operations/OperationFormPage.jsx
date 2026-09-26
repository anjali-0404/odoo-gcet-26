import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import LinesEditor, { newLine } from '../../components/operations/LinesEditor.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Form, { FormActions, FormGrid } from '../../components/ui/Form.jsx';
import Input, { Textarea } from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Select from '../../components/ui/Select.jsx';
import StatusSteps from '../../components/ui/StatusSteps.jsx';
import { Alert, ErrorState, LoadingState } from '../../components/ui/States.jsx';
import useAsync from '../../hooks/useAsync.js';
import useAuth from '../../hooks/useAuth.js';
import useForm from '../../hooks/useForm.js';
import { useLocationOptions, useProductOptions } from '../../hooks/useLookups.js';
import useToast from '../../hooks/useToast.js';
import { toPath } from '../../routes/paths.js';
import { operationApi } from '../../services/operationApi.js';
import { OPEN_STATUSES } from '../../utils/constants.js';
import { toDateInput } from '../../utils/format.js';
import { OPERATION_CONFIG } from '../../utils/operations.js';
import { required } from '../../utils/validation.js';

const emptyValues = () => ({
  contact: '',
  deliveryAddress: '',
  sourceLocation: '',
  destLocation: '',
  scheduledDate: toDateInput(new Date()),
  notes: '',
});

function valuesFromDoc(doc) {
  return {
    contact: doc.contact ?? '',
    deliveryAddress: doc.deliveryAddress ?? '',
    sourceLocation: doc.sourceLocation?._id ?? '',
    destLocation: doc.destLocation?._id ?? '',
    scheduledDate: toDateInput(doc.scheduledDate),
    notes: doc.notes ?? '',
  };
}

const linesFromDoc = (doc) =>
  doc.lines.map((l) =>
    newLine({ product: l.product._id, productRef: l.product, quantity: String(l.quantity), available: l.available, inStock: l.inStock })
  );

/** Request body for POST/PATCH /{receipts|deliveries|transfers} (docs/API.md §8). */
function buildPayload(cfg, values, lines) {
  const payload = {
    scheduledDate: values.scheduledDate || undefined,
    notes: values.notes.trim(),
    lines: lines.map((l) => ({ product: l.product, quantity: Number(l.quantity) })),
  };
  if (cfg.contactLabel) payload.contact = values.contact.trim();
  if (cfg.hasAddress) payload.deliveryAddress = values.deliveryAddress.trim();
  if (cfg.source) payload[cfg.source] = values[cfg.source];
  if (cfg.dest) payload[cfg.dest] = values[cfg.dest];
  return payload;
}

/** Per-line checks: product chosen, quantity > 0. Returns { [lineKey]: message }. */
function validateLines(lines) {
  const errors = {};
  for (const l of lines) {
    if (!l.product) errors[l.key] = 'Select a product';
    else if (!(Number(l.quantity) > 0)) errors[l.key] = 'Quantity must be greater than 0';
  }
  return errors;
}

/** Create / view / edit a receipt, delivery order or internal transfer. */
export default function OperationFormPage({ type }) {
  const cfg = OPERATION_CONFIG[type];
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const api = useMemo(() => operationApi(type), [type]);
  const doc = useAsync(() => (isNew ? Promise.resolve(null) : api.get(id)), [type, id]);
  const locationOptions = useLocationOptions();
  const products = useProductOptions();
  const form = useForm(emptyValues());
  const [lines, setLines] = useState([]);
  const [lineErrors, setLineErrors] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (doc.data) {
      form.setValues(valuesFromDoc(doc.data));
      setLines(linesFromDoc(doc.data));
      setLineErrors({});
    }
  }, [doc.data]);

  if (!isNew && doc.error) return <ErrorState error={doc.error} onRetry={doc.reload} />;
  if (!isNew && !doc.data) return <LoadingState />;

  const d = doc.data;
  const status = d?.status ?? 'draft';
  const editable = isNew || OPEN_STATUSES.includes(status);

  const validators = {
    ...(cfg.source && { [cfg.source]: required(cfg.sourceLabel) }),
    ...(cfg.dest && { [cfg.dest]: required(cfg.destLabel) }),
    ...(cfg.source && cfg.dest && {
      [cfg.dest]: (v, all) => (!v ? `${cfg.destLabel} is required` : v === all[cfg.source] ? 'Choose a different location' : null),
    }),
  };

  const save = form.submit(validators, async (values) => {
    const errors = validateLines(lines);
    setLineErrors(errors);
    if (Object.keys(errors).length) return;
    const payload = buildPayload(cfg, values, lines);
    const saved = isNew ? await api.create(payload) : await api.update(id, payload);
    toast.success(isNew ? `${saved.reference} created` : 'Changes saved');
    if (isNew) navigate(toPath(cfg.detailPath, { id: saved._id }), { replace: true });
    else doc.setData(saved);
  });

  const runAction = async (action, message) => {
    setBusy(action);
    try {
      const updated = await api[action](id);
      doc.setData(updated);
      toast.success(message(updated));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const f = form.values;
  return (
    <section>
      <PageHeader title={cfg.singular} newTo={isNew ? undefined : cfg.newPath} />

      {!isNew && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {status === 'draft' && (
            <Button variant="outline" size="sm" loading={busy === 'confirm'} onClick={() => runAction('confirm', (u) => `${u.reference} is ${u.status}`)}>
              To Do
            </Button>
          )}
          {OPEN_STATUSES.includes(status) && (
            <Button size="sm" icon="check" loading={busy === 'validate'} onClick={() => runAction('validate', (u) => `${u.reference} validated`)}>
              Validate
            </Button>
          )}
          {status === 'done' && (
            <Button variant="secondary" size="sm" icon="printer" onClick={() => window.print()}>
              Print
            </Button>
          )}
          {OPEN_STATUSES.includes(status) && (
            <Button variant="danger" size="sm" loading={busy === 'cancel'} onClick={() => runAction('cancel', (u) => `${u.reference} canceled`)}>
              Cancel
            </Button>
          )}
          <div className="ml-auto">
            <StatusSteps steps={cfg.steps} current={status} />
          </div>
        </div>
      )}

      <Card>
        <Form onSubmit={save}>
          <h2 className="text-2xl font-semibold text-text-strong">{d?.reference ?? `New ${cfg.singular.toLowerCase()}`}</h2>
          {form.formError && <Alert>{form.formError}</Alert>}

          <FormGrid>
            {cfg.contactLabel && (
              <Input label={cfg.contactLabel} value={f.contact} onChange={form.setField('contact')} disabled={!editable} />
            )}
            {cfg.hasAddress && (
              <Input label="Delivery address" value={f.deliveryAddress} onChange={form.setField('deliveryAddress')} disabled={!editable} />
            )}
            {cfg.source && (
              <Select
                label={cfg.sourceLabel}
                required
                placeholder="Select location"
                options={locationOptions}
                value={f[cfg.source]}
                onChange={form.setField(cfg.source)}
                error={form.errors[cfg.source]}
                disabled={!editable}
              />
            )}
            {cfg.dest && (
              <Select
                label={cfg.destLabel}
                required
                placeholder="Select location"
                options={locationOptions}
                value={f[cfg.dest]}
                onChange={form.setField(cfg.dest)}
                error={form.errors[cfg.dest]}
                disabled={!editable}
              />
            )}
            <Input label="Schedule date" type="date" value={f.scheduledDate} onChange={form.setField('scheduledDate')} disabled={!editable} />
            <Input label="Responsible" value={d?.responsible?.name || d?.responsible?.loginId || user?.name || user?.loginId || ''} disabled />
          </FormGrid>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-strong">Products</h3>
            <LinesEditor lines={lines} onChange={setLines} products={products} readOnly={!editable} lineErrors={lineErrors} />
          </div>

          <Textarea label="Notes" value={f.notes} onChange={form.setField('notes')} disabled={!editable} rows={2} />

          {editable && (
            <FormActions>
              <Button variant="secondary" onClick={() => navigate(cfg.listPath)}>
                Back
              </Button>
              <Button type="submit" loading={form.submitting}>
                {isNew ? 'Create' : 'Save'}
              </Button>
            </FormActions>
          )}
        </Form>
      </Card>
    </section>
  );
}
