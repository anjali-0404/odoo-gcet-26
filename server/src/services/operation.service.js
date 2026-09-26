/**
 * Receipts, delivery orders and internal transfers share one lifecycle:
 *
 *   draft --confirm--> ready | waiting --validate--> done
 *     \______________________________ cancel ____> canceled
 *
 * - Receipt confirm always goes to "ready".
 * - Delivery/transfer confirm goes to "ready" when every line is available at the
 *   source location (after other ready documents' reservations), otherwise "waiting".
 *   Confirm can be called again on a waiting document to re-check availability.
 * - Validate is allowed from draft/waiting/ready and moves stock in one transaction.
 */
import Delivery from '../models/Delivery.js';
import InternalTransfer from '../models/InternalTransfer.js';
import Receipt from '../models/Receipt.js';
import { OPEN_STATUSES } from '../models/common.js';
import ApiError from '../utils/ApiError.js';
import { containsRegex, paginated } from '../utils/query.js';
import { runInTransaction } from '../utils/transaction.js';
import { assertProductsExist, assertUserExists, getLocationOrFail } from './lookup.service.js';
import { nextReference } from './sequence.service.js';
import { checkAvailability, moveStock } from './stock.service.js';

const LOCATION_SELECT = 'name code fullName warehouse';

export const OPERATION_KINDS = {
  receipt: {
    Model: Receipt,
    label: 'Receipt',
    locationFields: { destLocation: 'Destination location' },
    primaryLocation: 'destLocation',
    source: null,
    dest: 'destLocation',
  },
  delivery: {
    Model: Delivery,
    label: 'Delivery',
    locationFields: { sourceLocation: 'Source location' },
    primaryLocation: 'sourceLocation',
    source: 'sourceLocation',
    dest: null,
  },
  transfer: {
    Model: InternalTransfer,
    label: 'Internal transfer',
    locationFields: { sourceLocation: 'Source location', destLocation: 'Destination location' },
    primaryLocation: 'sourceLocation',
    source: 'sourceLocation',
    dest: 'destLocation',
  },
};

export function populateFor(locationFields) {
  return [
    { path: 'warehouse', select: 'name code' },
    { path: 'responsible', select: 'name loginId email' },
    { path: 'createdBy', select: 'name loginId' },
    { path: 'validatedBy', select: 'name loginId' },
    { path: 'lines.product', select: 'name sku uom unitCost' },
    ...Object.keys(locationFields).map((path) => ({ path, select: LOCATION_SELECT })),
  ];
}

function kindConfig(kind) {
  const cfg = OPERATION_KINDS[kind];
  if (!cfg) throw new Error(`Unknown operation kind: ${kind}`);
  return cfg;
}

async function findOrFail(cfg, id, session = null) {
  const doc = await cfg.Model.findById(id).session(session);
  if (!doc) throw ApiError.notFound(`${cfg.label} not found`);
  return doc;
}

function assertOpen(cfg, doc, action) {
  if (!OPEN_STATUSES.includes(doc.status)) {
    throw ApiError.badRequest(`Cannot ${action} a ${cfg.label.toLowerCase()} that is ${doc.status}`);
  }
}

function assertHasLines(doc) {
  if (!doc.lines.length) throw ApiError.badRequest('Add at least one product line first');
}

/** Loads the location documents named in `data` and checks source != destination. */
async function resolveLocations(cfg, data, current = {}) {
  const resolved = {};
  for (const [field, label] of Object.entries(cfg.locationFields)) {
    const id = data[field] ?? current[field];
    resolved[field] = await getLocationOrFail(id, label);
  }
  if (cfg.source && cfg.dest && String(resolved[cfg.source]._id) === String(resolved[cfg.dest]._id)) {
    throw ApiError.badRequest('Source and destination must be different locations');
  }
  return resolved;
}

/** Adds per-line availability (for delivery/transfer documents that are still open). */
async function withAvailability(cfg, doc) {
  const json = doc.toJSON();
  if (!cfg.source || !OPEN_STATUSES.includes(doc.status) || !doc.lines.length) return json;

  const availability = await checkAvailability({
    locationId: json[cfg.source]._id,
    lines: json.lines,
    excludeId: doc._id,
  });
  json.lines = json.lines.map((line, i) => ({
    ...line,
    available: availability[i].available,
    inStock: availability[i].inStock,
  }));
  json.allInStock = availability.every((a) => a.inStock);
  return json;
}

export async function getById(kind, id) {
  const cfg = kindConfig(kind);
  const doc = await cfg.Model.findById(id).populate(populateFor(cfg.locationFields));
  if (!doc) throw ApiError.notFound(`${cfg.label} not found`);
  return withAvailability(cfg, doc);
}

export async function list(kind, query) {
  const cfg = kindConfig(kind);
  const filter = {};
  if (query.status) filter.status = { $in: query.status };
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.search) {
    const rx = containsRegex(query.search);
    filter.$or = [{ reference: rx }, { contact: rx }];
  }
  if (query.dateFrom || query.dateTo) {
    filter.scheduledDate = {};
    if (query.dateFrom) filter.scheduledDate.$gte = query.dateFrom;
    if (query.dateTo) filter.scheduledDate.$lte = query.dateTo;
  }

  const { page, limit } = query;
  const [items, total] = await Promise.all([
    cfg.Model.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(populateFor(cfg.locationFields)),
    cfg.Model.countDocuments(filter),
  ]);
  return paginated(items, total, { page, limit });
}

export async function create(kind, data, user) {
  const cfg = kindConfig(kind);
  const locations = await resolveLocations(cfg, data);
  await assertProductsExist((data.lines ?? []).map((l) => l.product));
  await assertUserExists(data.responsible);

  const warehouse = locations[cfg.primaryLocation].warehouse;
  const doc = await cfg.Model.create({
    ...data,
    lines: data.lines ?? [],
    reference: await nextReference(warehouse.code, kind),
    warehouse: warehouse._id,
    status: 'draft',
    responsible: data.responsible ?? user._id,
    createdBy: user._id,
  });
  return getById(kind, doc._id);
}

/** Re-evaluates ready/waiting for a delivery/transfer after confirm or edit. */
async function applyAvailabilityStatus(cfg, doc) {
  const availability = await checkAvailability({
    locationId: doc[cfg.source],
    lines: doc.lines,
    excludeId: doc._id,
  });
  doc.status = availability.every((a) => a.inStock) ? 'ready' : 'waiting';
}

export async function update(kind, id, data) {
  const cfg = kindConfig(kind);
  const doc = await findOrFail(cfg, id);
  assertOpen(cfg, doc, 'edit');

  const touchesLocations = Object.keys(cfg.locationFields).some((f) => data[f] !== undefined);
  if (touchesLocations) {
    const locations = await resolveLocations(cfg, data, doc);
    doc.warehouse = locations[cfg.primaryLocation].warehouse._id;
  }
  if (data.lines) await assertProductsExist(data.lines.map((l) => l.product));
  await assertUserExists(data.responsible);

  doc.set(data);
  if (cfg.source && doc.status !== 'draft') {
    if (!doc.lines.length) doc.status = 'draft';
    else await applyAvailabilityStatus(cfg, doc);
  }
  await doc.save();
  return getById(kind, doc._id);
}

export async function confirm(kind, id) {
  const cfg = kindConfig(kind);
  const doc = await findOrFail(cfg, id);
  if (!['draft', 'waiting'].includes(doc.status)) {
    throw ApiError.badRequest(`Only draft or waiting documents can be confirmed (this one is ${doc.status})`);
  }
  assertHasLines(doc);

  if (cfg.source) await applyAvailabilityStatus(cfg, doc);
  else doc.status = 'ready';
  await doc.save();
  return getById(kind, doc._id);
}

export async function validate(kind, id, user) {
  const cfg = kindConfig(kind);

  await runInTransaction(async (session) => {
    const doc = await findOrFail(cfg, id, session);
    assertOpen(cfg, doc, 'validate');
    assertHasLines(doc);

    const from = cfg.source ? await getLocationOrFail(doc[cfg.source], 'Source location', session) : null;
    const to = cfg.dest ? await getLocationOrFail(doc[cfg.dest], 'Destination location', session) : null;

    for (const line of doc.lines) {
      await moveStock({
        product: line.product,
        quantity: line.quantity,
        from,
        to,
        refType: kind,
        refId: doc._id,
        reference: doc.reference,
        contact: doc.contact ?? '',
        user,
        session,
      });
    }

    doc.status = 'done';
    doc.validatedBy = user._id;
    doc.validatedAt = new Date();
    await doc.save({ session });
  });

  return getById(kind, id);
}

export async function cancel(kind, id) {
  const cfg = kindConfig(kind);
  const doc = await findOrFail(cfg, id);
  assertOpen(cfg, doc, 'cancel');
  doc.status = 'canceled';
  doc.canceledAt = new Date();
  await doc.save();
  return getById(kind, doc._id);
}

/** Delivery picking/packing steps (informational; they don't move stock). */
export async function markDeliveryStep(id, step) {
  const cfg = kindConfig('delivery');
  const doc = await findOrFail(cfg, id);
  if (doc.status !== 'ready') {
    throw ApiError.badRequest(`Only ready deliveries can be ${step === 'pick' ? 'picked' : 'packed'}`);
  }
  if (step === 'pick') {
    doc.pickedAt = new Date();
  } else {
    if (!doc.pickedAt) throw ApiError.badRequest('Pick the items before packing');
    doc.packedAt = new Date();
  }
  await doc.save();
  return getById('delivery', doc._id);
}
