import { z } from 'zod';
import { objectId, optionalText, pagination, searchText } from './common.js';

// ---- Categories ----
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60),
  description: optionalText(300),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();

// ---- Products ----
const nonNegative = (label) => z.number({ error: `${label} must be a number` }).min(0, `${label} cannot be negative`);

const productBase = {
  name: z.string().trim().min(1, 'Product name is required').max(120),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(40)
    .regex(/^[A-Za-z0-9._\-/]+$/, 'SKU may only contain letters, numbers and . _ - /'),
  category: objectId.nullable().optional(),
  uom: z.string().trim().min(1).max(20).optional(),
  unitCost: nonNegative('Unit cost').optional(),
  reorderLevel: nonNegative('Reorder level').optional(),
  reorderQty: nonNegative('Reorder quantity').optional(),
  description: optionalText(1000),
};

export const productCreateSchema = z.object({
  ...productBase,
  initialStock: z
    .object({
      quantity: nonNegative('Initial stock'),
      // Defaults to the default location of the first warehouse.
      location: objectId.optional(),
    })
    .optional(),
});

export const productUpdateSchema = z.object({ ...productBase, isActive: z.boolean().optional() }).partial();

export const productListQuery = z.object({
  search: searchText,
  category: objectId.optional(),
  warehouse: objectId.optional(),
  stockStatus: z.enum(['in', 'low', 'out']).optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
  ...pagination(20),
});

export const stockListQuery = z.object({
  product: objectId.optional(),
  warehouse: objectId.optional(),
  location: objectId.optional(),
  category: objectId.optional(),
  search: searchText,
  includeZero: z.enum(['true', 'false']).optional(),
  ...pagination(50),
});
