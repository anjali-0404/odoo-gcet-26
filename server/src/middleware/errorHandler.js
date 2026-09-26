import mongoose from 'mongoose';
import env from '../config/env.js';

/**
 * Central error handler. Always responds with:
 *   { success: false, message: string, errors?: [{ field, message }] }
 *
 * Express 5 forwards rejected promises from async handlers here automatically,
 * so controllers can simply `throw`.
 */
// Express identifies error handlers by their 4-argument signature, so `next` stays.
export default function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors && !(err instanceof mongoose.Error) ? err.errors : undefined;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0]?.message || 'Validation failed';
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `A record with this ${field} already exists` : 'Duplicate record';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
    if (env.isProduction) message = 'Internal server error';
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}
