import ApiError from '../utils/ApiError.js';

const PARTS = ['params', 'query', 'body'];

/**
 * Validates request parts against zod schemas: validate({ params, query, body }).
 * Parsed (coerced, defaulted, stripped) values are exposed as req.valid.<part>,
 * because Express 5 makes req.query read-only.
 * On failure: 400 { success: false, message: <first problem>, errors: [{ field, message }] }.
 */
export default function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    const errors = [];

    for (const part of PARTS) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        req.valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          errors.push({ field: issue.path.join('.') || part, message: issue.message });
        }
      }
    }

    if (errors.length) return next(ApiError.badRequest(errors[0].message, errors));
    next();
  };
}
