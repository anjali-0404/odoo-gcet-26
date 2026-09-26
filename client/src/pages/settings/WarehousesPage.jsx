import { useState } from 'react';
import { Link } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Form from '../../components/ui/Form.jsx';
import Input, { Textarea } from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Alert, EmptyState } from '../../components/ui/States.jsx';
import Table from '../../components/ui/Table.jsx';
import useAsync from '../../hooks/useAsync.js';
import useForm from '../../hooks/useForm.js';
import useToast from '../../hooks/useToast.js';
import { PATHS } from '../../routes/paths.js';
import { warehouseApi } from '../../services/warehouseApi.js';
import { required } from '../../utils/validation.js';

function WarehouseModal({ warehouse, onClose, onSaved }) {
  const isNew = !warehouse?._id;
  const form = useForm({ name: warehouse?.name ?? '', code: warehouse?.code ?? '', address: warehouse?.address ?? '' });

  const onSubmit = form.submit(
    {
      name: required('Name'),
      code: (v) => (!v.trim() ? 'Short code is required' : /^[A-Za-z0-9]{1,10}$/.test(v.trim()) ? null : 'Use up to 10 letters or numbers'),
    },
    async (values) => {
      const payload = { name: values.name.trim(), code: values.code.trim().toUpperCase(), address: values.address.trim() };
      const saved = isNew ? await warehouseApi.create(payload) : await warehouseApi.update(warehouse._id, payload);
      onSaved(saved, isNew);
    }
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'New warehouse' : 'Edit warehouse'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="warehouse-form" loading={form.submitting}>
            Save
          </Button>
        </>
      }
    >
      <Form id="warehouse-form" onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input label="Name" required value={form.values.name} onChange={form.setField('name')} error={form.errors.name} autoFocus />
        <Input
          label="Short code"
          required
          value={form.values.code}
          onChange={form.setField('code')}
          error={form.errors.code}
          hint="Used in references, e.g. WH → WH/IN/0001"
        />
        <Textarea label="Address" value={form.values.address} onChange={form.setField('address')} />
        {isNew && <p className="text-xs text-muted">A default "Stock" location is created with the warehouse.</p>}
      </Form>
    </Modal>
  );
}

export default function WarehousesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => warehouseApi.list(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSaved = (saved, isNew) => {
    toast.success(isNew ? `Warehouse ${saved.code} created` : 'Warehouse updated');
    setEditing(null);
    reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await warehouseApi.remove(deleting._id);
      toast.success(`Warehouse ${deleting.code} deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (w) => <span className="font-medium text-text-strong">{w.name}</span> },
    { key: 'code', header: 'Short code' },
    { key: 'address', header: 'Address', render: (w) => w.address || '—' },
    {
      key: 'locationCount',
      header: 'Locations',
      align: 'right',
      render: (w) => (
        <Link to={`${PATHS.LOCATIONS}?warehouse=${w._id}`} className="text-accent hover:underline">
          {w.locationCount}
        </Link>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (w) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(w)} aria-label={`Edit ${w.name}`} />
          <Button variant="ghost" size="sm" icon="trash" onClick={() => setDeleting(w)} aria-label={`Delete ${w.name}`} />
        </div>
      ),
    },
  ];

  return (
    <section>
      <PageHeader title="Warehouses" subtitle="Warehouse details and short codes" onNew={() => setEditing({})} />
      <Table
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={<EmptyState title="No warehouses yet" message="Create your first warehouse to start tracking stock." />}
      />
      {editing && <WarehouseModal warehouse={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete warehouse?"
        message={`${deleting?.name} and its locations will be deleted. Warehouses with stock or history cannot be deleted.`}
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}
