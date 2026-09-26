import { Navigate } from 'react-router';
import useAuth from '../hooks/useAuth.js';
import { AUTH_ENFORCED } from '../utils/constants.js';
import { PATHS } from './paths.js';

/** Auth pages: logged-in users are sent to the dashboard instead. */
export default function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (AUTH_ENFORCED && isAuthenticated) {
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }
  return children;
}
