import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Form, { FormActions, FormGrid } from '../../components/ui/Form.jsx';
import Input, { Textarea } from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Select from '../../components/ui/Select.jsx';
import { Alert, ErrorState, LoadingState } from '../../components/ui/States.jsx';
import useAsync from '../../hooks/useAsync.js';
import useForm from '../../hooks/useForm.js';
import { useCategoryOptions, useLocationOptions } from '../../hooks/useLookups.js';
import useToast from '../../hooks/useToast.js';
import { PATHS, toPath } from '../../routes/paths.js';
import { productApi } from '../../services/productApi.js';
import { UOM_SUGGESTIONS } from '../../utils/constants.js';
import { required } from '../../utils/validation.js';

const EMPTY = {
  name: '',
  sku: '',
  category: '',
  uom: 'Units',
  unitCost: '0',
  reorderLevel: '0',
  reorderQty: '0',
  description: '',
  initialQuantity: '0',
  initialLocation: '',
};

const nonNegative = (label) => (v) =>
  v === '' || Number.isNaN(Number(v)) || Number(v) < 0 ? `${label} must be 0 or more` : null;

/** Builds the POST/PATCH /products body (docs/API.md §6). */
function toPayload(values, isNew) {
  const payload = {
    name: values.name.trim(),
    sku: values.sku.trim(),
    category: values.category || null,
    uom: values.uom.trim() || 'Units',
    unitCost: Number(values.unitCost),
    reorderLevel: Number(values.reorderLevel),
    reorderQty: Number(values.reorderQty),
    description: values.description.trim(),
  };
  if (isNew && Number(values.initialQuantity) > 0) {
    payload.initialStock = {
      quantity: Number(values.initialQuantity),
      ...(values.initialLocation && { location: values.initialLocation }),
    };
  }
  return payload;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const categoryOptions = useCategoryOptions();
  const locationOptions = useLocationOptions();
  const form = useForm(EMPTY);
  const existing = useAsync(() => (isNew ? Promise.resolve(null) : productApi.get(id)), [id]);

  useEffect(() => {
    const p = existing.data;
    if (p) {
      form.setValues({
        ...EMPTY,
        name: p.name,
        sku: p.sku,
        category: p.category?._id ?? '',
        uom: p.uom,
        unitCost: String(p.unitCost),
        reorderLevel: String(p.reorderLevel),
        reorderQty: String(p.reorderQty),
        description: p.description ?? '',
      });
    }
  }, [existing.data]);

  if (!isNew && existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;
  if (!isNew && !existing.data) return <LoadingState />;

  const onSubmit = form.submit(
    {
      name: required('Product name'),
      sku: required('SKU'),
      unitCost: nonNegative('Unit cost'),
      reorderLevel: nonNegative('Reorder level'),
      reorderQty: nonNegative('Reorder quantity'),
      initialQuantity: isNew ? nonNegative('Initial stock') : () => null,
    },
    async (values) => {
      const payload = toPayload(values, isNew);
      const saved = isNew ? await productApi.create(payload) : await productApi.update(id, payload);
      toast.success(isNew ? 'Product created' : 'Product updated');
      navigate(toPath(PATHS.PRODUCT_DETAIL, { id: saved._id }));
    }
  );

  const f = form.values;
  return (
    <section>
      <PageHeader title={isNew ? 'New product' : `Edit ${existing.data.name}`} />
      <Card>
        <Form onSubmit={onSubmit}>
          {form.formError && <Alert>{form.formError}</Alert>}
          <FormGrid>
            <Input label="Product name" required value={f.name} onChange={form.setField('name')} error={form.errors.name} />
            <Input label="SKU / Code" required value={f.sku} onChange={form.setField('sku')} error={form.errors.sku} hint="Unique, e.g. DESK001" />
            <Select label="Category" placeholder="No category" options={categoryOptions} value={f.category} onChange={form.setField('category')} error={form.errors.category} />
            <Input label="Unit of measure" list="uom-options" value={f.uom} onChange={form.setField('uom')} error={form.errors.uom} />
            <Input label="Per unit cost (₹)" type="number" min="0" step="0.01" value={f.unitCost} onChange={form.setField('unitCost')} error={form.errors.unitCost} />
            <Input
              label="Reorder level"
              type="number"
              min="0"
              value={f.reorderLevel}
              onChange={form.setField('reorderLevel')}
              error={form.errors.reorderLevel}
              hint="At or below this quantity the product counts as low stock"
            />
            <Input label="Reorder quantity" type="number" min="0" value={f.reorderQty} onChange={form.setField('reorderQty')} error={form.errors.reorderQty} />
          </FormGrid>
          <datalist id="uom-options">
            {UOM_SUGGESTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <Textarea label="Description" value={f.description} onChange={form.setField('description')} error={form.errors.description} />

          {isNew && (
            <fieldset className="rounded-lg border border-border p-4">
              <legend className="px-1 text-xs font-medium text-muted">Initial stock (optional)</legend>
              <FormGrid>
                <Input
                  label="Quantity"
                  type="number"
                  min="0"
                  value={f.initialQuantity}
                  onChange={form.setField('initialQuantity')}
                  error={form.errors.initialQuantity}
                />
                <Select
                  label="Location"
                  placeholder="Default location of the first warehouse"
                  options={locationOptions}
                  value={f.initialLocation}
                  onChange={form.setField('initialLocation')}
                />
              </FormGrid>
            </fieldset>
          )}

          <FormActions>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.submitting}>
              {isNew ? 'Create product' : 'Save changes'}
            </Button>
          </FormActions>
        </Form>
      </Card>
    </section>
  );
}
