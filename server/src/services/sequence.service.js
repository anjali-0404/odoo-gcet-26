import Counter from '../models/Counter.js';

/** Codes used in reference numbers: <WAREHOUSE>/<CODE>/<NNNN>. */
export const OPERATION_CODES = {
  receipt: 'IN',
  delivery: 'OUT',
  transfer: 'INT',
  adjustment: 'ADJ',
};

/**
 * Next reference for a warehouse and operation type, e.g. "WH/IN/0001".
 * Runs outside transactions on purpose: a gap after a failed create is acceptable,
 * contention on the counter inside every transaction is not.
 */
export async function nextReference(warehouseCode, type) {
  const key = `${warehouseCode}/${OPERATION_CODES[type]}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return `${key}/${String(counter.seq).padStart(4, '0')}`;
}
