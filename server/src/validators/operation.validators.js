import { z } from 'zod';
import { LEDGER_DIRECTIONS, LEDGER_REF_TYPES } from '../models/StockLedger.js';
import { OPERATION_STATUSES } from '../models/common.js';
import {
  csvEnum,
  dateRange,
  objectId,
  optionalText,
  pagination,
  searchText,
  uniqueProductLines,
} from './common.js';

export const DOCUMENT_TYPES = ['receipt', 'delivery', 'transfer', 'adjustment'];

const quantityLine = z.object({
  product: objectId,
  quantity: z.number({ error: 'Quantity must be a number' }).positive('Quantity must be greater than 0'),
});
const lines = uniqueProductLines(quantityLine);

const common = {
  scheduledDate: z.coerce.date({ error: 'Invalid schedule date' }).optional(),
  responsible: objectId.optional(),
  notes: optionalText(1000),
  lines: lines.optional(),
};

// ---- Receipts ----
export const receiptCreateSchema = z.object({
  ...common,
  contact: optionalText(120),
  destLocation: objectId,
});
export const receiptUpdateSchema = receiptCreateSchema.partial();

// ---- Deliveries ----
export const deliveryCreateSchema = z.object({
  ...common,
  contact: optionalText(120),
  deliveryAddress: optionalText(300),
  sourceLocation: objectId,
});
export const deliveryUpdateSchema = deliveryCreateSchema.partial();

// ---- Internal transfers ----
export const transferCreateSchema = z
  .object({ ...common, sourceLocation: objectId, destLocation: objectId })
  .refine((v) => v.sourceLocation !== v.destLocation, {
    message: 'Source and destination must be different locations',
    path: ['destLocation'],
  });
export const transferUpdateSchema = z
  .object({ ...common, sourceLocation: objectId, destLocation: objectId })
  .partial();

// ---- Inventory adjustments ----
const countLine = z.object({
  product: objectId,
  countedQuantity: z
    .number({ error: 'Counted quantity must be a number' })
    .min(0, 'Counted quantity cannot be negative'),
});
export const adjustmentCreateSchema = z.object({
  location: objectId,
  scheduledDate: common.scheduledDate,
  responsible: common.responsible,
  reason: optionalText(300),
  notes: common.notes,
  lines: uniqueProductLines(countLine).optional(),
});
export const adjustmentUpdateSchema = adjustmentCreateSchema.omit({ location: true }).partial();

// ---- List queries ----
export const operationListQuery = z.object({
  status: csvEnum(OPERATION_STATUSES),
  warehouse: objectId.optional(),
  search: searchText,
  ...dateRange,
  ...pagination(20),
});

export const ledgerListQuery = z.object({
  product: objectId.optional(),
  warehouse: objectId.optional(),
  location: objectId.optional(),
  refType: csvEnum(LEDGER_REF_TYPES),
  direction: z.enum(LEDGER_DIRECTIONS).optional(),
  search: searchText,
  ...dateRange,
  ...pagination(50),
});

export const dashboardSummaryQuery = z.object({
  warehouse: objectId.optional(),
  category: objectId.optional(),
});

export const dashboardOperationsQuery = z.object({
  type: csvEnum(DOCUMENT_TYPES),
  status: csvEnum(OPERATION_STATUSES),
  warehouse: objectId.optional(),
  category: objectId.optional(),
  search: searchText,
  ...pagination(20),
});
