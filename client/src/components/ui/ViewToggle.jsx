import Icon from './Icon.jsx';

/** List / kanban switch from the mockup. */
export default function ViewToggle({ value, onChange }) {
  const item = (view, icon, label) => (
    <button
      type="button"
      onClick={() => onChange(view)}
      aria-pressed={value === view}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center ${
        value === view ? 'bg-accent-muted text-accent' : 'text-muted hover:text-text-strong'
      }`}
    >
      <Icon name={icon} />
    </button>
  );
  return (
    <div className="flex overflow-hidden rounded-md border border-border bg-surface-2">
      {item('list', 'list', 'List view')}
      {item('kanban', 'kanban', 'Kanban view')}
    </div>
  );
}
