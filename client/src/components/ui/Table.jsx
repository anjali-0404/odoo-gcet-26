import { EmptyState, ErrorState, LoadingState } from './States.jsx';

/**
 * Data table.
 *   columns: [{ key, header, render?(row), align?: 'left'|'right'|'center', className? }]
 *   rows:    array of objects; rowKey picks the React key (default "_id")
 * Shows LoadingState / ErrorState / EmptyState instead of the body when appropriate.
 */
export default function Table({
  columns,
  rows,
  rowKey = '_id',
  onRowClick,
  rowClassName,
  loading = false,
  error,
  onRetry,
  empty,
  className = '',
}) {
  const align = (c) => (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left');
  const showLoading = loading && !rows?.length;

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-surface ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-accent/70 text-xs text-muted">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-medium whitespace-nowrap ${align(c)}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          {!showLoading && !error && rows?.length > 0 && (
            <tbody className={loading ? 'opacity-60' : ''}>
              {rows.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-border last:border-b-0 ${
                    onRowClick ? 'cursor-pointer hover:bg-surface-2' : ''
                  } ${rowClassName?.(row) ?? ''}`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${align(c)} ${c.className ?? ''}`}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {showLoading && <LoadingState />}
      {error && !loading && <ErrorState error={error} onRetry={onRetry} />}
      {!loading && !error && !rows?.length && (empty ?? <EmptyState title="No records found" />)}
    </div>
  );
}
