/**
 * Inventory adjustments: a physical count at one location.
 * Lifecycle: draft --validate--> done, or draft --cancel--> canceled.
 * On validation each line's recorded quantity is re-read and stock is set to the
 * counted quantity; the difference (counted - recorded) is logged in the ledger.
 */
import InventoryAdjustment from '../models/InventoryAdjustment.js';
import ApiError from '../utils/ApiError.js';
import { containsRegex, paginated } from '../utils/query.js';
import { runInTransaction } from '../utils/transaction.js';
import { assertProductsExist, assertUserExists, getLocationOrFail } from './lookup.service.js';
import { populateFor } from './operation.service.js';
import { nextReference } from './sequence.service.js';
import { getQuantityAt, moveStock, round } from './stock.service.js';

const POPULATE = populateFor({ location: 'Location' });

async function findOrFail(id, session = null) {
  const doc = await InventoryAdjustment.findById(id).session(session);
  if (!doc) throw ApiError.notFound('Adjustment not found');
  return doc;
}

function assertDraft(doc, action) {
  if (doc.status !== 'draft') {
    throw ApiError.badRequest(`Cannot ${action} an adjustment that is ${doc.status}`);
  }
}

/** Snapshot of recorded quantity and difference for each counted line. */
async function snapshotLines(locationId, lines, session = null) {
  return Promise.all(
    lines.map(async (line) => {
      const systemQuantity = await getQuantityAt(line.product, locationId, session);
      return {
        product: line.product,
        countedQuantity: line.countedQuantity,
        systemQuantity,
        difference: round(line.countedQuantity - systemQuantity),
      };
    })
  );
}

export async function getById(id) {
  const doc = await InventoryAdjustment.findById(id).populate(POPULATE);
  if (!doc) throw ApiError.notFound('Adjustment not found');
  return doc;
}

export async function list(query) {
  const filter = {};
  if (query.status) filter.status = { $in: query.status };
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.search) {
    const rx = containsRegex(query.search);
    filter.$or = [{ reference: rx }, { reason: rx }];
  }
  if (query.dateFrom || query.dateTo) {
    filter.scheduledDate = {};
    if (query.dateFrom) filter.scheduledDate.$gte = query.dateFrom;
    if (query.dateTo) filter.scheduledDate.$lte = query.dateTo;
  }

  const { page, limit } = query;
  const [items, total] = await Promise.all([
    InventoryAdjustment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE),
    InventoryAdjustment.countDocuments(filter),
  ]);
  return paginated(items, total, { page, limit });
}

export async function create(data, user) {
  const location = await getLocationOrFail(data.location);
  const lines = data.lines ?? [];
  await assertProductsExist(lines.map((l) => l.product));
  await assertUserExists(data.responsible);

  const doc = await InventoryAdjustment.create({
    ...data,
    lines: await snapshotLines(location._id, lines),
    reference: await nextReference(location.warehouse.code, 'adjustment'),
    warehouse: location.warehouse._id,
    status: 'draft',
    responsible: data.responsible ?? user._id,
    createdBy: user._id,
  });
  return getById(doc._id);
}

export async function update(id, data) {
  const doc = await findOrFail(id);
  assertDraft(doc, 'edit');
  await assertUserExists(data.responsible);

  const { lines, ...rest } = data;
  doc.set(rest);
  if (lines) {
    await assertProductsExist(lines.map((l) => l.product));
    doc.lines = await snapshotLines(doc.location, lines);
  }
  await doc.save();
  return getById(doc._id);
}

export async function validate(id, user) {
  await runInTransaction(async (session) => {
    const doc = await findOrFail(id, session);
    assertDraft(doc, 'validate');
    if (!doc.lines.length) throw ApiError.badRequest('Add at least one product line first');

    const location = await getLocationOrFail(doc.location, 'Location', session);

    for (const line of doc.lines) {
      // Re-read the recorded quantity: stock may have moved since the draft was created.
      const systemQuantity = await getQuantityAt(line.product, location._id, session);
      const difference = round(line.countedQuantity - systemQuantity);
      line.systemQuantity = systemQuantity;
      line.difference = difference;

      if (difference !== 0) {
        await moveStock({
          product: line.product,
          quantity: Math.abs(difference),
          from: difference < 0 ? location : null,
          to: difference > 0 ? location : null,
          refType: 'adjustment',
          refId: doc._id,
          reference: doc.reference,
          note: doc.reason,
          user,
          session,
        });
      }
    }

    doc.status = 'done';
    doc.validatedBy = user._id;
    doc.validatedAt = new Date();
    await doc.save({ session });
  });

  return getById(id);
}

export async function cancel(id) {
  const doc = await findOrFail(id);
  assertDraft(doc, 'cancel');
  doc.status = 'canceled';
  doc.canceledAt = new Date();
  await doc.save();
  return getById(doc._id);
}
