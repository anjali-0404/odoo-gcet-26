import Button from './Button.jsx';

/** Pagination for the API's { page, totalPages, total } list payload. */
export default function Pagination({ page, totalPages, total, onChange }) {
  if (!totalPages || totalPages <= 1) {
    return total ? <p className="mt-3 text-xs text-muted">{total} record(s)</p> : null;
  }
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
      <span>
        Page {page} of {totalPages} · {total} record(s)
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon="chevronLeft" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Prev
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
