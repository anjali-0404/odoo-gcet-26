export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" matcher for user search input. */
export function containsRegex(text) {
  return new RegExp(escapeRegex(text.trim()), 'i');
}

/** Standard paginated payload used by every list endpoint. */
export function paginated(items, total, { page, limit }) {
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

/** Paginates an array already in memory (used where results are merged/filtered in JS). */
export function paginateArray(array, { page, limit }) {
  const start = (page - 1) * limit;
  return paginated(array.slice(start, start + limit), array.length, { page, limit });
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
