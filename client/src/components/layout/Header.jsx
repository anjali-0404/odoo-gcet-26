import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import useAuth from '../../hooks/useAuth.js';
import { PATHS } from '../../routes/paths.js';
import Logo from './Logo.jsx';

// Top navigation, following the mockup: Dashboard, Operations, Products,
// Move History, Settings, with the profile menu (avatar) on the right.
const NAV_ITEMS = [
  { label: 'Dashboard', to: PATHS.DASHBOARD },
  {
    label: 'Operations',
    children: [
      { label: 'Receipts', to: PATHS.RECEIPTS },
      { label: 'Delivery Orders', to: PATHS.DELIVERIES },
      { label: 'Internal Transfers', to: PATHS.TRANSFERS },
      { label: 'Inventory Adjustments', to: PATHS.ADJUSTMENTS },
    ],
  },
  {
    label: 'Products',
    children: [
      { label: 'Stock', to: PATHS.PRODUCTS },
      { label: 'Categories', to: PATHS.CATEGORIES },
    ],
  },
  { label: 'Move History', to: PATHS.MOVE_HISTORY },
  {
    label: 'Settings',
    children: [
      { label: 'Warehouses', to: PATHS.WAREHOUSES },
      { label: 'Locations', to: PATHS.LOCATIONS },
    ],
  },
];

const linkBase = 'rounded-md px-3 py-2 text-sm font-medium transition-colors';
const linkIdle = 'text-text hover:bg-surface-2 hover:text-text-strong';
const linkActive = 'text-accent';

function isGroupActive(item, pathname) {
  return item.children.some((child) => pathname.startsWith(child.to));
}

/** Closes a popover on outside click, Escape, or navigation. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DropdownPanel({ children, align = 'left' }) {
  return (
    <div
      className={`absolute top-full z-30 mt-2 min-w-52 rounded-lg border border-border bg-surface p-1 shadow-xl shadow-black/40 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {children}
    </div>
  );
}

function menuItemClass({ isActive }) {
  return `block rounded-md px-3 py-2 text-sm ${
    isActive ? 'bg-accent-muted text-accent' : 'text-text hover:bg-surface-2 hover:text-text-strong'
  }`;
}

function NavGroup({ item }) {
  const { open, setOpen, ref } = usePopover();
  const { pathname } = useLocation();
  const active = isGroupActive(item, pathname);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`${linkBase} inline-flex items-center gap-1 ${active ? linkActive : linkIdle}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <Chevron open={open} />
      </button>
      {open && (
        <DropdownPanel>
          {item.children.map((child) => (
            <NavLink key={child.to} to={child.to} className={menuItemClass}>
              {child.label}
            </NavLink>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { open, setOpen, ref } = usePopover();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.loginId || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-accent text-sm font-semibold text-accent hover:bg-accent-muted"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        onClick={() => setOpen((v) => !v)}
      >
        {initial}
      </button>
      {open && (
        <DropdownPanel align="right">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-text-strong">{displayName}</p>
            {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <NavLink to={PATHS.PROFILE} className={menuItemClass}>
            My Profile
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-surface-2"
          >
            Logout
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}

function MobileNav() {
  const { open, setOpen, ref } = usePopover();

  return (
    <div className="md:hidden" ref={ref}>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-md text-text hover:bg-surface-2"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full z-30 border-b border-border bg-surface px-4 py-3 shadow-xl shadow-black/40">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="py-1">
                <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <NavLink key={child.to} to={child.to} className={menuItemClass}>
                    {child.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} className={menuItemClass}>
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      )}
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-accent bg-bg/95 backdrop-blur">
      <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <MobileNav />
        <Link to={PATHS.DASHBOARD} className="shrink-0" aria-label="StockSense home">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="ml-auto">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
