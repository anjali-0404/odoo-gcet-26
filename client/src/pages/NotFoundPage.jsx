import { Link } from 'react-router';
import { PATHS } from '../routes/paths.js';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-accent">404</p>
      <h1 className="mt-3 text-lg font-semibold text-text-strong">Page not found</h1>
      <p className="mt-1 text-sm text-muted">The page you are looking for does not exist.</p>
      <Link
        to={PATHS.DASHBOARD}
        className="mt-6 rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent-muted"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
