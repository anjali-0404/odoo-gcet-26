import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import KanbanBoard from '../../components/operations/KanbanBoard.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Select from '../../components/ui/Select.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States.jsx';
import Table from '../../components/ui/Table.jsx';
import ViewToggle from '../../components/ui/ViewToggle.jsx';
import useAsync from '../../hooks/useAsync.js';
import { toPath } from '../../routes/paths.js';
import { operationApi } from '../../services/operationApi.js';
import { STATUS_OPTIONS } from '../../utils/constants.js';
import { formatDate, formatQty, isLate } from '../../utils/format.js';
import { fromLabel, OPERATION_CONFIG, toLabel } from '../../utils/operations.js';
import { readStorage, writeStorage } from '../../utils/storage.js';

const KANBAN_LIMIT = 100;

function columnsFor(type) {
  const date = {
    key: 'scheduledDate',
    header: 'Schedule date',
    render: (d) => <span className={isLate(d.scheduledDate, d.status) ? 'text-danger' : ''}>{formatDate(d.scheduledDate)}</span>,
  };
  const reference = { key: 'reference', header: 'Reference', render: (d) => <span className="font-medium text-text-strong">{d.reference}</span> };
  const status = { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> };

  if (type === 'adjustment') {
    return [
      reference,
      { key: 'location', header: 'Location', render: (d) => d.location?.fullName },
      { key: 'reason', header: 'Reason', render: (d) => d.reason || '—' },
      { key: 'lines', header: 'Products', align: 'right', render: (d) => d.lines.length },
      date,
      status,
    ];
  }
  return [
    reference,
    { key: 'from', header: 'From', render: (d) => fromLabel(type, d) },
    { key: 'to', header: 'To', render: (d) => toLabel(type, d) },
    ...(OPERATION_CONFIG[type].contactLabel ? [{ key: 'contact', header: 'Contact', render: (d) => d.contact || '—' }] : []),
    date,
    {
      key: 'qty',
      header: 'Quantity',
      align: 'right',
      render: (d) => formatQty(d.lines.reduce((sum, l) => sum + l.quantity, 0)),
    },
    status,
  ];
}

/** List (default) and kanban views for receipts, deliveries, transfers and adjustments. */
export default function OperationListPage({ type }) {
  const cfg = OPERATION_CONFIG[type];
  const navigate = useNavigate();
  const api = useMemo(() => operationApi(type), [type]);
  const viewKey = `stocksense_view_${type}`;
  const [view, setView] = useState(() => readStorage(viewKey) ?? 'list');
  const [params, setParams] = useState({ search: '', status: '', page: 1 });

  const query = Object.fromEntries(
    Object.entries({ ...params, ...(view === 'kanban' && { page: 1, limit: KANBAN_LIMIT }) }).filter(([, v]) => v !== '')
  );
  const { data, loading, error, reload } = useAsync(() => api.list(query), [type, JSON.stringify(query)]);

  const set = (key) => (value) => setParams((p) => ({ ...p, [key]: value?.target ? value.target.value : value, page: 1 }));
  const changeView = (v) => {
    writeStorage(viewKey, v);
    setView(v);
  };
  const open = (d) => navigate(toPath(cfg.detailPath, { id: d._id }));

  const statuses = [...cfg.steps, 'canceled'];
  const empty = (
    <EmptyState
      title={`No ${cfg.title.toLowerCase()} yet`}
      message={cfg.emptyHint}
      action={
        <Button variant="outline" size="sm" icon="plus" onClick={() => navigate(cfg.newPath)}>
          New {cfg.singular.toLowerCase()}
        </Button>
      }
    />
  );

  return (
    <section>
      <PageHeader title={cfg.title} newTo={cfg.newPath}>
        <SearchInput
          value={params.search}
          onSearch={set('search')}
          placeholder={type === 'adjustment' ? 'Search reference or reason' : 'Search reference or contact'}
        />
        <Select
          placeholder="All statuses"
          options={STATUS_OPTIONS.filter((o) => statuses.includes(o.value))}
          value={params.status}
          onChange={set('status')}
          aria-label="Status"
        />
        <ViewToggle value={view} onChange={changeView} />
      </PageHeader>

      {view === 'list' ? (
        <>
          <Table
            columns={columnsFor(type)}
            rows={data?.items}
            loading={loading}
            error={error}
            onRetry={reload}
            onRowClick={open}
            empty={params.search || params.status ? <EmptyState title="No documents match your search" /> : empty}
          />
          {data && <Pagination {...data} onChange={(page) => setParams((p) => ({ ...p, page }))} />}
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <KanbanBoard
          statuses={params.status ? [params.status] : statuses}
          docs={data.items}
          onOpen={open}
          describe={(d) => (type === 'adjustment' ? d.location?.fullName : `${fromLabel(type, d)} → ${toLabel(type, d)}`)}
        />
      )}
    </section>
  );
}
