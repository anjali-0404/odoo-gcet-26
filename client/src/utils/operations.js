import { PATHS } from '../routes/paths.js';

/**
 * Per-type configuration for the four operation documents. Pages read labels,
 * routes, status trails and field layout from here instead of branching on type.
 */
export const OPERATION_CONFIG = {
  receipt: {
    type: 'receipt',
    title: 'Receipts',
    singular: 'Receipt',
    listPath: PATHS.RECEIPTS,
    newPath: PATHS.RECEIPT_NEW,
    detailPath: PATHS.RECEIPT_DETAIL,
    steps: ['draft', 'ready', 'done'],
    contactLabel: 'Receive From',
    source: null,
    dest: 'destLocation',
    destLabel: 'Destination location',
    emptyHint: 'Create a receipt when goods arrive from a vendor.',
  },
  delivery: {
    type: 'delivery',
    title: 'Delivery Orders',
    singular: 'Delivery',
    listPath: PATHS.DELIVERIES,
    newPath: PATHS.DELIVERY_NEW,
    detailPath: PATHS.DELIVERY_DETAIL,
    steps: ['draft', 'waiting', 'ready', 'done'],
    contactLabel: 'Customer',
    hasAddress: true,
    source: 'sourceLocation',
    sourceLabel: 'Source location',
    dest: null,
    emptyHint: 'Create a delivery order when stock leaves for a customer.',
  },
  transfer: {
    type: 'transfer',
    title: 'Internal Transfers',
    singular: 'Internal transfer',
    listPath: PATHS.TRANSFERS,
    newPath: PATHS.TRANSFER_NEW,
    detailPath: PATHS.TRANSFER_DETAIL,
    steps: ['draft', 'waiting', 'ready', 'done'],
    contactLabel: null,
    source: 'sourceLocation',
    sourceLabel: 'Source location',
    dest: 'destLocation',
    destLabel: 'Destination location',
    emptyHint: 'Move stock between warehouses, racks or rooms.',
  },
  adjustment: {
    type: 'adjustment',
    title: 'Inventory Adjustments',
    singular: 'Adjustment',
    listPath: PATHS.ADJUSTMENTS,
    newPath: PATHS.ADJUSTMENT_NEW,
    detailPath: PATHS.ADJUSTMENT_DETAIL,
    steps: ['draft', 'done'],
    contactLabel: null,
    source: null,
    dest: null,
    emptyHint: 'Record a physical count to fix differences with recorded stock.',
  },
};

/** "From" display value for a list row. */
export function fromLabel(type, doc) {
  if (type === 'receipt') return doc.contact || 'Vendor';
  if (type === 'adjustment') return doc.location?.fullName ?? '—';
  return doc.sourceLocation?.fullName ?? '—';
}

/** "To" display value for a list row. */
export function toLabel(type, doc) {
  if (type === 'delivery') return doc.contact || 'Customer';
  if (type === 'adjustment') return doc.location?.fullName ?? '—';
  return doc.destLocation?.fullName ?? '—';
}
