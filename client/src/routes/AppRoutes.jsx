import { Navigate, Route, Routes } from 'react-router';
import AppLayout from '../layouts/AppLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import SignupPage from '../pages/auth/SignupPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import MoveHistoryPage from '../pages/ledger/MoveHistoryPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import AdjustmentFormPage from '../pages/operations/AdjustmentFormPage.jsx';
import OperationFormPage from '../pages/operations/OperationFormPage.jsx';
import OperationListPage from '../pages/operations/OperationListPage.jsx';
import CategoriesPage from '../pages/products/CategoriesPage.jsx';
import ProductDetailPage from '../pages/products/ProductDetailPage.jsx';
import ProductFormPage from '../pages/products/ProductFormPage.jsx';
import ProductListPage from '../pages/products/ProductListPage.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import LocationsPage from '../pages/settings/LocationsPage.jsx';
import WarehousesPage from '../pages/settings/WarehousesPage.jsx';
import { OPERATION_CONFIG } from '../utils/operations.js';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import { PATHS } from './paths.js';

// Receipts, deliveries and transfers share one list page and one form page.
// `key` makes React remount the page when switching type, so state never leaks.
const operationRoutes = ['receipt', 'delivery', 'transfer'].flatMap((type) => {
  const cfg = OPERATION_CONFIG[type];
  return [
    <Route key={cfg.listPath} path={cfg.listPath} element={<OperationListPage key={type} type={type} />} />,
    <Route key={cfg.newPath} path={cfg.newPath} element={<OperationFormPage key={`${type}-new`} type={type} />} />,
    <Route key={cfg.detailPath} path={cfg.detailPath} element={<OperationFormPage key={type} type={type} />} />,
  ];
});

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.SIGNUP} element={<SignupPage />} />
        <Route path={PATHS.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={PATHS.DASHBOARD} replace />} />
        <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />

        <Route path={PATHS.PRODUCTS} element={<ProductListPage />} />
        <Route path={PATHS.PRODUCT_NEW} element={<ProductFormPage key="new" />} />
        <Route path={PATHS.PRODUCT_DETAIL} element={<ProductDetailPage />} />
        <Route path={PATHS.PRODUCT_EDIT} element={<ProductFormPage key="edit" />} />
        <Route path={PATHS.CATEGORIES} element={<CategoriesPage />} />

        {operationRoutes}
        <Route path={PATHS.ADJUSTMENTS} element={<OperationListPage key="adjustment" type="adjustment" />} />
        <Route path={PATHS.ADJUSTMENT_NEW} element={<AdjustmentFormPage key="new" />} />
        <Route path={PATHS.ADJUSTMENT_DETAIL} element={<AdjustmentFormPage key="detail" />} />

        <Route path={PATHS.MOVE_HISTORY} element={<MoveHistoryPage />} />
        <Route path={PATHS.WAREHOUSES} element={<WarehousesPage />} />
        <Route path={PATHS.LOCATIONS} element={<LocationsPage />} />
        <Route path={PATHS.PROFILE} element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
