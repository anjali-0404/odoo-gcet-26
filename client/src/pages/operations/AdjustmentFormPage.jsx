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
import { formatQty, signedQty, toDateInput } from '../../utils/format.js';
import { OPERATION_CONFIG } from '../../utils/operations.js';
import { required } from '../../utils/validation.js';

const cfg = OPERATION_CONFIG.adjustment;

const linesFromDoc = (doc) =>
  doc.lines.map((l) =>
    newLine({
      product: l.product._id,
      productRef: l.product,
      countedQuantity: String(l.countedQuantity),
      systemQuantity: l.systemQuantity,
      difference: l.difference,
    })
  );

function validateLines(lines) {
  const errors = {};
  for (const l of lines) {
    if (!l.product) errors[l.key] = 'Select a product';
    else if (l.countedQuantity === '' || Number(l.countedQuantity) < 0) errors[l.key] = 'Counted quantity must be 0 or more';
  }
  return errors;
}

/** Inventory adjustment: counted vs recorded quantity at one location. */
export default function AdjustmentFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const api = useMemo(() => operationApi('adjustment'), []);
  const doc = useAsync(() => (isNew ? Promise.resolve(null) : api.get(id)), [id]);
  const locationOptions = useLocationOptions();
  const products = useProductOptions();
  const form = useForm({ location: '', reason: '', scheduledDate: toDateInput(new Date()), notes: '' });
  const [lines, setLines] = useState([]);
  const [lineErrors, setLineErrors] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    const d = doc.data;
    if (d) {
      form.setValues({ location: d.location?._id ?? '', reason: d.reason ?? '', scheduledDate: toDateInput(d.scheduledDate), notes: d.notes ?? '' });
      setLines(linesFromDoc(d));
      setLineErrors({});
    }
  }, [doc.data]);

  if (!isNew && doc.error) return <ErrorState error={doc.error} onRetry={doc.reload} />;
  if (!isNew && !doc.data) return <LoadingState />;

  const d = doc.data;
  const status = d?.status ?? 'draft';
  const editable = status === 'draft';

  const save = form.submit({ location: required('Location') }, async (values) => {
    const errors = validateLines(lines);
    setLineErrors(errors);
    if (Object.keys(errors).length) return;
    const payload = {
      reason: values.reason.trim(),
      notes: values.notes.trim(),
      scheduledDate: values.scheduledDate || undefined,
      lines: lines.map((l) => ({ product: l.product, countedQuantity: Number(l.countedQuantity) })),
    };
    const saved = isNew ? await api.create({ ...payload, location: values.location }) : await api.update(id, payload);
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

  const extraColumns = [
    { header: 'Recorded', align: 'right', render: (l) => formatQty(l.systemQuantity) },
    {
      header: 'Difference',
      align: 'right',
      render: (l) =>
        l.difference === undefined ? (
          '—'
        ) : (
          <span className={l.difference < 0 ? 'text-danger' : l.difference > 0 ? 'text-success' : 'text-muted'}>
            {signedQty(l.difference)}
          </span>
        ),
    },
  ];

  return (
    <section>
      <PageHeader title={cfg.singular} newTo={isNew ? undefined : cfg.newPath} />

      {!isNew && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {editable && (
            <>
              <Button size="sm" icon="check" loading={busy === 'validate'} onClick={() => runAction('validate', (u) => `${u.reference} applied`)}>
                Validate
              </Button>
              <Button variant="danger" size="sm" loading={busy === 'cancel'} onClick={() => runAction('cancel', (u) => `${u.reference} canceled`)}>
                Cancel
              </Button>
            </>
          )}
          <div className="ml-auto">
            <StatusSteps steps={cfg.steps} current={status} />
          </div>
        </div>
      )}

      <Card>
        <Form onSubmit={save}>
          <h2 className="text-2xl font-semibold text-text-strong">{d?.reference ?? 'New adjustment'}</h2>
          {form.formError && <Alert>{form.formError}</Alert>}
          <FormGrid>
            <Select
              label="Location"
              required
              placeholder="Select location"
              options={locationOptions}
              value={form.values.location}
              onChange={form.setField('location')}
              error={form.errors.location}
              disabled={!isNew}
            />
            <Input label="Reason" value={form.values.reason} onChange={form.setField('reason')} disabled={!editable} placeholder="e.g. Damaged, cycle count" />
            <Input label="Date" type="date" value={form.values.scheduledDate} onChange={form.setField('scheduledDate')} disabled={!editable} />
            <Input label="Responsible" value={d?.responsible?.name || d?.responsible?.loginId || user?.name || user?.loginId || ''} disabled />
          </FormGrid>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-strong">Counted products</h3>
            <LinesEditor
              lines={lines}
              onChange={setLines}
              products={products}
              readOnly={!editable}
              quantityKey="countedQuantity"
              quantityLabel="Counted"
              extraColumns={extraColumns}
              lineErrors={lineErrors}
            />
          </div>

          <Textarea label="Notes" value={form.values.notes} onChange={form.setField('notes')} disabled={!editable} rows={2} />

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
