// Small inline icon set (stroke icons, 20x20 viewBox). <Icon name="plus" className="h-4 w-4" />
const PATHS = {
  plus: 'M10 4v12M4 10h12',
  search: 'M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM13.5 13.5 17 17',
  list: 'M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01',
  kanban: 'M3 4h4v12H3zM8 4h4v8H8zM13 4h4v10h-4z',
  x: 'M5 5l10 10M15 5 5 15',
  check: 'M4 10.5 8 14.5 16 5.5',
  trash: 'M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10',
  edit: 'M4 16h3l8.5-8.5-3-3L4 13v3zM11 5.5l3 3',
  printer: 'M6 8V3h8v5M6 14H4V8h12v6h-2M6 12h8v5H6z',
  chevronLeft: 'M12 5l-5 5 5 5',
  chevronRight: 'M8 5l5 5-5 5',
  alert: 'M10 3 2 17h16L10 3zM10 8v4M10 14.5h.01',
  box: 'M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7zM3 6.5 10 10l7-3.5M10 10v7',
  arrowRight: 'M4 10h12M11 5l5 5-5 5',
  refresh: 'M16 10a6 6 0 1 1-1.8-4.3M16 3v4h-4',
};

export default function Icon({ name, className = 'h-4 w-4', ...props }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={PATHS[name]} />
    </svg>
  );
}
