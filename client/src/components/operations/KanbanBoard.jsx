import { StatusBadge } from '../ui/Badge.jsx';
import { STATUS_META } from '../../utils/constants.js';
import { formatDate, isLate } from '../../utils/format.js';

/** Kanban view of operation documents grouped by status (mockup: "switch to kanban view based on status"). */
export default function KanbanBoard({ statuses, docs, onOpen, describe }) {
  return (
    <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
      {statuses.map((status) => {
        const items = docs.filter((d) => d.status === status);
        return (
          <div key={status} className="min-w-56 rounded-xl border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold text-text-strong">{STATUS_META[status].label}</span>
              <span className="rounded-full bg-surface-2 px-2 text-xs text-muted">{items.length}</span>
            </header>
            <div className="space-y-2 p-3">
              {items.length === 0 && <p className="py-4 text-center text-xs text-muted">Nothing here</p>}
              {items.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => onOpen(d)}
                  className="block w-full rounded-lg border border-border bg-surface-2 p-3 text-left hover:border-accent/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text-strong">{d.reference}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{describe(d)}</p>
                  <p className={`mt-1 text-xs ${isLate(d.scheduledDate, d.status) ? 'text-danger' : 'text-muted'}`}>
                    {formatDate(d.scheduledDate)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
