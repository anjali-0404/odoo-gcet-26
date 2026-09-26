import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge, StockBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States.jsx';
import Table from '../../components/ui/Table.jsx';
import useAsync from '../../hooks/useAsync.js';
import useToast from '../../hooks/useToast.js';
import { PATHS, toPath } from '../../routes/paths.js';
import { ledgerApi } from '../../services/ledgerApi.js';
import { productApi } from '../../services/productApi.js';
import { LEDGER_TYPE_META } from '../../utils/constants.js';
import { formatDateTime, formatMoney, formatQty } from '../../utils/format.js';

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-strong">{children}</dd>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const product = useAsync(() => productApi.get(id), [id]);
  const moves = useAsync(() => ledgerApi.list({ product: id, limit: 10 }), [id]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  if (product.error) return <ErrorState error={product.error} onRetry={product.reload} />;
  if (!product.data) return <LoadingState />;
  const p = product.data;

  const archive = async () => {
    setArchiving(true);
    try {
      await productApi.archive(id);
      toast.success(`${p.name} archived`);
      navigate(PATHS.PRODUCTS);
    } catch (err) {
      toast.error(err.message);
      setArchiving(false);
    }
  };

  const moveColumns = [
    { key: 'createdAt', header: 'Date', render: (m) => formatDateTime(m.createdAt) },
    { key: 'reference', header: 'Reference', render: (m) => m.reference || LEDGER_TYPE_META[m.refType] },
    { key: 'from', header: 'From', render: (m) => m.fromLocation?.fullName ?? (m.contact || 'Vendor') },
    { key: 'to', header: 'To', render: (m) => m.toLocation?.fullName ?? (m.contact || 'Customer') },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (m) => (
        <span className={m.direction === 'in' ? 'text-success' : m.direction === 'out' ? 'text-danger' : ''}>
          {m.direction === 'in' ? '+' : m.direction === 'out' ? '-' : ''}
          {formatQty(m.quantity)}
        </span>
      ),
    },
  ];

  return (
    <section className="space-y-5">
      <PageHeader title={p.name} subtitle={`SKU ${p.sku}`}>
        {!p.isActive && <Badge tone="danger">Archived</Badge>}
        <StockBadge status={p.stockStatus} />
        <Button as={Link} to={toPath(PATHS.PRODUCT_EDIT, { id })} variant="secondary" size="sm" icon="edit">
          Edit
        </Button>
        {p.isActive && (
          <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmArchive(true)}>
            Archive
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail label="Category">{p.category?.name ?? '—'}</Detail>
            <Detail label="Unit of measure">{p.uom}</Detail>
            <Detail label="Per unit cost">{formatMoney(p.unitCost)}</Detail>
            <Detail label="Reorder level">{formatQty(p.reorderLevel)}</Detail>
            <Detail label="Reorder quantity">{formatQty(p.reorderQty)}</Detail>
            <Detail label="Description">{p.description || '—'}</Detail>
          </dl>
        </Card>
        <Card title="Availability">
          <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1">
            <Detail label="On hand">
              <span className="text-xl font-semibold">{formatQty(p.onHand)}</span> {p.uom}
            </Detail>
            <Detail label="Reserved">{formatQty(p.reserved)}</Detail>
            <Detail label="Free to use">{formatQty(p.freeToUse)}</Detail>
          </dl>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-strong">Stock by location</h2>
        <Table
          rowKey="key"
          columns={[
            { key: 'location', header: 'Location', render: (r) => r.location.fullName },
            { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse.name },
            { key: 'quantity', header: 'On hand', align: 'right', render: (r) => formatQty(r.quantity) },
            { key: 'reserved', header: 'Reserved', align: 'right', render: (r) => formatQty(r.reserved) },
            { key: 'freeToUse', header: 'Free to use', align: 'right', render: (r) => formatQty(r.freeToUse) },
          ]}
          rows={p.stockByLocation.map((r) => ({ ...r, key: r.location._id }))}
          empty={<EmptyState title="No stock yet" message="Validate a receipt or adjustment to add stock." />}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-strong">Recent moves</h2>
          <Link to={`${PATHS.MOVE_HISTORY}?product=${id}`} className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        <Table
          columns={moveColumns}
          rows={moves.data?.items}
          loading={moves.loading}
          error={moves.error}
          onRetry={moves.reload}
          empty={<EmptyState title="No moves yet" />}
        />
      </div>

      <ConfirmDialog
        open={confirmArchive}
        title="Archive product?"
        message={`${p.name} will be hidden from product lists. Its history stays in the ledger.`}
        confirmLabel="Archive"
        tone="danger"
        loading={archiving}
        onConfirm={archive}
        onClose={() => setConfirmArchive(false)}
      />
    </section>
  );
}
