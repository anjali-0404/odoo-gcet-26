export const APP_NAME = 'StockSense';

/**
 * Route guards enforce login when this is true (enabled in Phase 4).
 * Set to false only for UI work without a running API.
 */
export const AUTH_ENFORCED = true;

export const TOKEN_STORAGE_KEY = 'stocksense_token';
export const USER_STORAGE_KEY = 'stocksense_user';

/** Fired by the API client when the server answers 401 (expired/invalid token). */
export const UNAUTHORIZED_EVENT = 'stocksense:unauthorized';

// Status values from the problem statement; the backend uses the same lowercase keys.
export const OPERATION_STATUS = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  CANCELED: 'canceled',
};

export const OPEN_STATUSES = ['draft', 'waiting', 'ready'];

export const STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral' },
  waiting: { label: 'Waiting', tone: 'warning' },
  ready: { label: 'Ready', tone: 'info' },
  done: { label: 'Done', tone: 'success' },
  canceled: { label: 'Canceled', tone: 'danger' },
};

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }));

export const DOCUMENT_TYPE = {
  RECEIPT: 'receipt',
  DELIVERY: 'delivery',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'receipt', label: 'Receipts' },
  { value: 'delivery', label: 'Deliveries' },
  { value: 'transfer', label: 'Internal transfers' },
  { value: 'adjustment', label: 'Adjustments' },
];

export const STOCK_STATUS_META = {
  in: { label: 'In stock', tone: 'success' },
  low: { label: 'Low stock', tone: 'warning' },
  out: { label: 'Out of stock', tone: 'danger' },
};

export const STOCK_STATUS_OPTIONS = Object.entries(STOCK_STATUS_META).map(([value, m]) => ({ value, label: m.label }));

export const LEDGER_TYPE_META = {
  initial: 'Initial stock',
  receipt: 'Receipt',
  delivery: 'Delivery',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
};

export const DIRECTION_OPTIONS = [
  { value: 'in', label: 'Incoming' },
  { value: 'out', label: 'Outgoing' },
  { value: 'internal', label: 'Internal' },
];

export const UOM_SUGGESTIONS = ['Units', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack'];
