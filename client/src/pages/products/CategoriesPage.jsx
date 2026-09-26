import { useState } from 'react';
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
import { categoryApi } from '../../services/productApi.js';
import { required } from '../../utils/validation.js';

function CategoryModal({ category, onClose, onSaved }) {
  const isNew = !category?._id;
  const form = useForm({ name: category?.name ?? '', description: category?.description ?? '' });

  const onSubmit = form.submit({ name: required('Category name') }, async (values) => {
    const payload = { name: values.name.trim(), description: values.description.trim() };
    const saved = isNew ? await categoryApi.create(payload) : await categoryApi.update(category._id, payload);
    onSaved(saved, isNew);
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'New category' : 'Edit category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={form.submitting}>
            Save
          </Button>
        </>
      }
    >
      <Form id="category-form" onSubmit={onSubmit}>
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input label="Name" required value={form.values.name} onChange={form.setField('name')} error={form.errors.name} autoFocus />
        <Textarea label="Description" value={form.values.description} onChange={form.setField('description')} />
      </Form>
    </Modal>
  );
}

export default function CategoriesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => categoryApi.list(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSaved = (saved, isNew) => {
    toast.success(isNew ? `Category "${saved.name}" created` : 'Category updated');
    setEditing(null);
    reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await categoryApi.remove(deleting._id);
      toast.success(`Category "${deleting.name}" deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (c) => <span className="font-medium text-text-strong">{c.name}</span> },
    { key: 'description', header: 'Description', render: (c) => c.description || '—' },
    { key: 'productCount', header: 'Products', align: 'right' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} />
          <Button variant="ghost" size="sm" icon="trash" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} />
        </div>
      ),
    },
  ];

  return (
    <section>
      <PageHeader title="Product Categories" onNew={() => setEditing({})} />
      <Table
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={<EmptyState title="No categories yet" message="Group products by category to filter stock and the dashboard." />}
      />
      {editing && <CategoryModal category={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category?"
        message={`"${deleting?.name}" will be deleted. Categories that still have products cannot be deleted.`}
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}
