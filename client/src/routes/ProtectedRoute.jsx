import { Navigate, useLocation } from 'react-router';
import useAuth from '../hooks/useAuth.js';
import { AUTH_ENFORCED } from '../utils/constants.js';
import { PATHS } from './paths.js';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (AUTH_ENFORCED && !isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }
  return children;
}
