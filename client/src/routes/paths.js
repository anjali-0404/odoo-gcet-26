// Single source of truth for URLs. Use these instead of string literals.
export const PATHS = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  DASHBOARD: '/dashboard',

  PRODUCTS: '/products',
  PRODUCT_NEW: '/products/new',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_EDIT: '/products/:id/edit',
  CATEGORIES: '/categories',

  RECEIPTS: '/operations/receipts',
  RECEIPT_NEW: '/operations/receipts/new',
  RECEIPT_DETAIL: '/operations/receipts/:id',

  DELIVERIES: '/operations/deliveries',
  DELIVERY_NEW: '/operations/deliveries/new',
  DELIVERY_DETAIL: '/operations/deliveries/:id',

  TRANSFERS: '/operations/transfers',
  TRANSFER_NEW: '/operations/transfers/new',
  TRANSFER_DETAIL: '/operations/transfers/:id',

  ADJUSTMENTS: '/operations/adjustments',
  ADJUSTMENT_NEW: '/operations/adjustments/new',
  ADJUSTMENT_DETAIL: '/operations/adjustments/:id',

  MOVE_HISTORY: '/move-history',

  WAREHOUSES: '/settings/warehouses',
  LOCATIONS: '/settings/locations',

  PROFILE: '/profile',
};

/** Fill route params: toPath(PATHS.RECEIPT_DETAIL, { id }) */
export function toPath(pattern, params = {}) {
  return pattern.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]));
}
