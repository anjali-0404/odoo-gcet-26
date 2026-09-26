/**
 * Every successful response uses this envelope: { success: true, data }.
 * Errors are formatted by middleware/errorHandler.js.
 */
export function sendSuccess(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}
