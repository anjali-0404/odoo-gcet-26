import { useState } from 'react';
import { useNavigate } from 'react-router';
import { StockBadge } from '../../components/ui/Badge.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Select from '../../components/ui/Select.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import Table from '../../components/ui/Table.jsx';
import useAsync from '../../hooks/useAsync.js';
import { useCategoryOptions, useWarehouseOptions } from '../../hooks/useLookups.js';
import { PATHS, toPath } from '../../routes/paths.js';
import { productApi } from '../../services/productApi.js';
import { STOCK_STATUS_OPTIONS } from '../../utils/constants.js';
import { formatMoney, formatQty } from '../../utils/format.js';

/** "Stock" screen from the mockup: product, unit cost, on hand, free to use. */
export default function ProductListPage() {
  const navigate = useNavigate();
  const categoryOptions = useCategoryOptions();
  const warehouseOptions = useWarehouseOptions();
  const [params, setParams] = useState({ search: '', category: '', warehouse: '', stockStatus: '', page: 1 });

  const set = (key) => (value) => setParams((p) => ({ ...p, [key]: value?.target ? value.target.value : value, page: 1 }));
  const query = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
  const { data, loading, error, reload } = useAsync(() => productApi.list(query), [JSON.stringify(query)]);

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div>
          <p className="font-medium text-text-strong">{p.name}</p>
          <p className="text-xs text-muted">{p.sku}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => p.category?.name ?? '—' },
    { key: 'unitCost', header: 'Per unit cost', align: 'right', render: (p) => formatMoney(p.unitCost) },
    { key: 'onHand', header: 'On hand', align: 'right', render: (p) => `${formatQty(p.onHand)} ${p.uom}` },
    { key: 'freeToUse', header: 'Free to use', align: 'right', render: (p) => formatQty(p.freeToUse) },
    { key: 'stockStatus', header: 'Status', render: (p) => <StockBadge status={p.stockStatus} /> },
  ];

  return (
    <section>
      <PageHeader title="Stock" subtitle="Products and their availability" newTo={PATHS.PRODUCT_NEW}>
        <SearchInput value={params.search} onSearch={set('search')} placeholder="Search name or SKU" />
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select placeholder="All categories" options={categoryOptions} value={params.category} onChange={set('category')} aria-label="Category" />
        <Select placeholder="All warehouses" options={warehouseOptions} value={params.warehouse} onChange={set('warehouse')} aria-label="Warehouse" />
        <Select placeholder="Any stock status" options={STOCK_STATUS_OPTIONS} value={params.stockStatus} onChange={set('stockStatus')} aria-label="Stock status" />
      </div>

      <Table
        columns={columns}
        rows={data?.items}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(p) => navigate(toPath(PATHS.PRODUCT_DETAIL, { id: p._id }))}
        empty={<EmptyState title="No products found" message="Create a product or change the filters." />}
      />
      {data && <Pagination {...data} onChange={(page) => setParams((p) => ({ ...p, page }))} />}
    </section>
  );
}
