import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Form from '../../components/ui/Form.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Select from '../../components/ui/Select.jsx';
import { Alert, EmptyState } from '../../components/ui/States.jsx';
import Table from '../../components/ui/Table.jsx';
import useAsync from '../../hooks/useAsync.js';
import useForm from '../../hooks/useForm.js';
import { useWarehouseOptions } from '../../hooks/useLookups.js';
import useToast from '../../hooks/useToast.js';
import { locationApi } from '../../services/warehouseApi.js';
import { required } from '../../utils/validation.js';

function LocationModal({ location, defaultWarehouse, warehouseOptions, onClose, onSaved }) {
  const isNew = !location?._id;
  const form = useForm({
    name: location?.name ?? '',
    code: location?.code ?? '',
    warehouse: location?.warehouse?._id ?? defaultWarehouse ?? '',
  });

  const onSubmit = form.submit(
    {
      name: required('Name'),
      code: (v) => (!v.trim() ? 'Short code is required' : /^[A-Za-z0-9_-]{1,20}$/.test(v.trim()) ? null : 'Use up to 20 letters, numbers, _ or -'),
      warehouse: required('Warehouse'),
    },
    async (values) => {
      const payload = { name: values.name.trim(), code: values.code.trim().toUpperCase() };
      const saved = isNew
        ? await locationApi.create({ ...payload, warehouse: values.warehouse })
        : await locationApi.update(location._id, payload);
      onSaved(saved, isNew);
    }
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'New location' : 'Edit location'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="location-form" loading={form.submitting}>
            Save
          </Button>
        </>
      }
    >
      <Form id="location-form" onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input label="Name" required value={form.values.name} onChange={form.setField('name')} error={form.errors.name} autoFocus hint="e.g. Rack A, Production Floor" />
        <Input label="Short code" required value={form.values.code} onChange={form.setField('code')} error={form.errors.code} />
        <Select
          label="Warehouse"
          required
          placeholder="Select warehouse"
          options={warehouseOptions}
          value={form.values.warehouse}
          onChange={form.setField('warehouse')}
          error={form.errors.warehouse}
          disabled={!isNew}
          hint={isNew ? undefined : 'A location cannot move to another warehouse'}
        />
      </Form>
    </Modal>
  );
}

export default function LocationsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const warehouse = searchParams.get('warehouse') ?? '';
  const warehouseOptions = useWarehouseOptions();
  const { data, loading, error, reload } = useAsync(() => locationApi.list(warehouse ? { warehouse } : {}), [warehouse]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSaved = (saved, isNew) => {
    toast.success(isNew ? `Location ${saved.fullName} created` : 'Location updated');
    setEditing(null);
    reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await locationApi.remove(deleting._id);
      toast.success(`Location ${deleting.fullName} deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Location',
      render: (l) => (
        <span className="flex items-center gap-2 font-medium text-text-strong">
          {l.fullName}
          {l.isDefault && <Badge tone="accent">Default</Badge>}
        </span>
      ),
    },
    { key: 'code', header: 'Short code' },
    { key: 'warehouse', header: 'Warehouse', render: (l) => l.warehouse?.name },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (l) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(l)} aria-label={`Edit ${l.fullName}`} />
          {!l.isDefault && (
            <Button variant="ghost" size="sm" icon="trash" onClick={() => setDeleting(l)} aria-label={`Delete ${l.fullName}`} />
          )}
        </div>
      ),
    },
  ];

  return (
    <section>
      <PageHeader title="Locations" subtitle="Rooms, racks and shelves inside warehouses" onNew={() => setEditing({})}>
        <Select
          placeholder="All warehouses"
          options={warehouseOptions}
          value={warehouse}
          onChange={(e) => setSearchParams(e.target.value ? { warehouse: e.target.value } : {})}
          aria-label="Warehouse"
        />
      </PageHeader>
      <Table
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={<EmptyState title="No locations" message="Add racks, rooms or shelves to a warehouse." />}
      />
      {editing && (
        <LocationModal
          location={editing}
          defaultWarehouse={warehouse}
          warehouseOptions={warehouseOptions}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete location?"
        message={`${deleting?.fullName} will be deleted. Locations with stock or history cannot be deleted.`}
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}
