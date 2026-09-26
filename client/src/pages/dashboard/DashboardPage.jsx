import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Badge, StatusBadge, StockBadge } from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States.jsx';
import Table from '../../components/ui/Table.jsx';
import useAsync from '../../hooks/useAsync.js';
import { useCategoryOptions, useWarehouseOptions } from '../../hooks/useLookups.js';
import { PATHS, toPath } from '../../routes/paths.js';
import { dashboardApi } from '../../services/dashboardApi.js';
import { DOCUMENT_TYPE_OPTIONS, STATUS_OPTIONS } from '../../utils/constants.js';
import { formatDate, formatQty, isLate } from '../../utils/format.js';
import { OPERATION_CONFIG } from '../../utils/operations.js';

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined));

function Kpi({ label, value, tone, to }) {
  const content = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone ?? 'text-text-strong'}`}>{value ?? '—'}</p>
    </>
  );
  const cls = 'block rounded-xl border border-border bg-surface p-4 transition-colors';
  return to ? (
    <Link to={to} className={`${cls} hover:border-accent/60`}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}

/** Receipt / Delivery card from the mockup: "[N to receive]   1 Late · 6 operations". */
function OperationCard({ title, counts, actionLabel, to, stats }) {
  return (
    <div className="rounded-xl border border-accent/60 bg-surface p-5">
      <h2 className="text-base font-semibold text-accent">{title}</h2>
      <div className="mt-4 flex items-start justify-between gap-4">
        <Link
          to={to}
          className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-muted"
        >
          {counts?.ready ?? 0} {actionLabel}
        </Link>
        <ul className="space-y-1 text-right text-sm">
          {stats.map(([key, label]) => (
            <li key={key}>
              <span className={key === 'late' && counts?.[key] ? 'font-semibold text-danger' : 'text-text-strong'}>
                {counts?.[key] ?? 0}
              </span>{' '}
              <span className="text-muted">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const warehouseOptions = useWarehouseOptions();
  const categoryOptions = useCategoryOptions();
  const [filters, setFilters] = useState({ type: '', status: '', warehouse: '', category: '' });
  const [page, setPage] = useState(1);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  const summary = useAsync(
    () => dashboardApi.summary(clean({ warehouse: filters.warehouse, category: filters.category })),
    [filters.warehouse, filters.category]
  );
  const operations = useAsync(() => dashboardApi.operations(clean({ ...filters, page })), [
    filters.type,
    filters.status,
    filters.warehouse,
    filters.category,
    page,
  ]);

  const s = summary.data;
  const columns = [
    { key: 'reference', header: 'Reference', render: (r) => <span className="font-medium text-text-strong">{r.reference}</span> },
    { key: 'type', header: 'Type', render: (r) => <Badge>{OPERATION_CONFIG[r.type].singular}</Badge> },
    { key: 'from', header: 'From', render: (r) => r.from ?? '—' },
    { key: 'to', header: 'To', render: (r) => r.to ?? '—' },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      render: (r) => (
        <span className={isLate(r.scheduledDate, r.status) ? 'text-danger' : ''}>{formatDate(r.scheduledDate)}</span>
      ),
    },
    { key: 'totalQuantity', header: 'Qty', align: 'right', render: (r) => formatQty(r.totalQuantity) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Snapshot of inventory operations" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Document type" placeholder="All types" options={DOCUMENT_TYPE_OPTIONS} value={filters.type} onChange={setFilter('type')} />
        <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={filters.status} onChange={setFilter('status')} />
        <Select label="Warehouse" placeholder="All warehouses" options={warehouseOptions} value={filters.warehouse} onChange={setFilter('warehouse')} />
        <Select label="Product category" placeholder="All categories" options={categoryOptions} value={filters.category} onChange={setFilter('category')} />
      </div>

      {summary.error ? (
        <ErrorState error={summary.error} onRetry={summary.reload} />
      ) : !s ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Total Products in Stock" value={s.products.inStock} to={PATHS.PRODUCTS} />
            <Kpi label="Low Stock" value={s.products.lowStock} tone={s.products.lowStock ? 'text-warning' : undefined} to={PATHS.PRODUCTS} />
            <Kpi label="Out of Stock" value={s.products.outOfStock} tone={s.products.outOfStock ? 'text-danger' : undefined} to={PATHS.PRODUCTS} />
            <Kpi label="Pending Receipts" value={s.receipts.pending} to={PATHS.RECEIPTS} />
            <Kpi label="Pending Deliveries" value={s.deliveries.pending} to={PATHS.DELIVERIES} />
            <Kpi label="Internal Transfers Scheduled" value={s.transfers.pending} to={PATHS.TRANSFERS} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <OperationCard
              title="Receipt"
              counts={s.receipts}
              actionLabel="to receive"
              to={PATHS.RECEIPTS}
              stats={[['late', 'Late'], ['upcoming', 'operations']]}
            />
            <OperationCard
              title="Delivery"
              counts={s.deliveries}
              actionLabel="to deliver"
              to={PATHS.DELIVERIES}
              stats={[['late', 'Late'], ['waiting', 'waiting'], ['upcoming', 'operations']]}
            />
            <Card title="Low stock alerts" bodyClassName="p-0">
              {s.lowStockItems.length ? (
                <ul className="divide-y divide-border">
                  {s.lowStockItems.map((p) => (
                    <li key={p._id}>
                      <Link
                        to={toPath(PATHS.PRODUCT_DETAIL, { id: p._id })}
                        className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-surface-2"
                      >
                        <span className="truncate">
                          <span className="text-muted">[{p.sku}]</span> {p.name}
                        </span>
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-text-strong">
                            {formatQty(p.onHand)} {p.uom}
                          </span>
                          <StockBadge status={p.stockStatus} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="All stocked up" message="No product is at or below its reorder level." icon="check" />
              )}
            </Card>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-strong">Operations</h2>
        <Table
          columns={columns}
          rows={operations.data?.items}
          loading={operations.loading}
          error={operations.error}
          onRetry={operations.reload}
          onRowClick={(r) => navigate(toPath(OPERATION_CONFIG[r.type].detailPath, { id: r._id }))}
          empty={<EmptyState title="No operations match these filters" />}
        />
        {operations.data && <Pagination {...operations.data} onChange={setPage} />}
      </div>
    </section>
  );
}
