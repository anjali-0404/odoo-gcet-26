import { Link } from 'react-router';
import Button from './Button.jsx';

/**
 * Page title row from the mockup: [NEW] Title ............ [toolbar]
 * with the coral rule underneath.
 *   newTo / onNew: shows the NEW button (link or click handler)
 *   children:      right-hand toolbar (search, view toggle, actions)
 */
export default function PageHeader({ title, subtitle, newTo, onNew, newLabel = 'New', children }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 border-b-2 border-accent/70 pb-3">
      {newTo && (
        <Button as={Link} to={newTo} variant="outline" size="sm" icon="plus">
          {newLabel}
        </Button>
      )}
      {onNew && (
        <Button variant="outline" size="sm" icon="plus" onClick={onNew}>
          {newLabel}
        </Button>
      )}
      <div className="mr-auto min-w-0">
        <h1 className="truncate text-xl font-semibold text-text-strong">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
