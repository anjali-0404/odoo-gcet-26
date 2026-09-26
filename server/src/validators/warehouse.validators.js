import { z } from 'zod';
import { objectId, optionalText } from './common.js';

export const warehouseCreateSchema = z.object({
  name: z.string().trim().min(1, 'Warehouse name is required').max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Short code is required')
    .max(10, 'Short code can be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Short code may only contain letters and numbers'),
  address: optionalText(300),
});
export const warehouseUpdateSchema = warehouseCreateSchema.partial();

const locationFields = {
  name: z.string().trim().min(1, 'Location name is required').max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Short code is required')
    .max(20, 'Short code can be at most 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Short code may only contain letters, numbers, _ and -'),
};

export const locationCreateSchema = z.object({ ...locationFields, warehouse: objectId });
// A location cannot move to another warehouse (its stock and history belong to it).
export const locationUpdateSchema = z.object(locationFields).partial();

export const locationListQuery = z.object({ warehouse: objectId.optional() });
