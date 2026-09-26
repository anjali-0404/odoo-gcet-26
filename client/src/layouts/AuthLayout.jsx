import { Outlet } from 'react-router';
import Logo from '../components/layout/Logo.jsx';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-black/30">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
