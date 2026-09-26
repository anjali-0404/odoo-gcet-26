import { z } from 'zod';

// "destLocation" -> "Dest location"
const humanize = (key) => {
  const words = String(key).replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Friendlier default message for missing fields: "Login id is required".
z.config({
  customError: (issue) => {
    if (issue.code === 'invalid_type' && issue.input === undefined && issue.path?.length) {
      return `${humanize(issue.path.at(-1))} is required`;
    }
    return undefined;
  },
});

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParams = z.object({ id: objectId });

export const pagination = (defaultLimit = 20) => ({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(defaultLimit),
});

export const searchText = z.string().trim().max(100).optional();
export const optionalText = (max) => z.string().trim().max(max).optional();

/** Query param holding one or more comma-separated enum values: ?status=draft,ready -> ['draft','ready'] */
export const csvEnum = (values) =>
  z
    .string()
    .trim()
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return undefined;
      const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
      const bad = parts.find((p) => !values.includes(p));
      if (bad) {
        ctx.addIssue({ code: 'custom', message: `Invalid value "${bad}". Allowed: ${values.join(', ')}` });
        return z.NEVER;
      }
      return parts;
    });

export const dateRange = {
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

/** Array of lines where each product may appear only once. */
export const uniqueProductLines = (lineSchema) =>
  z
    .array(lineSchema)
    .max(200)
    .refine((lines) => new Set(lines.map((l) => l.product)).size === lines.length, {
      message: 'Each product can appear only once',
    });
