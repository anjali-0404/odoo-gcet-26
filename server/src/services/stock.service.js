/**
 * The ONLY module allowed to change stock quantities.
 *
 * Every change goes through moveStock(), which:
 *   1. decreases the source location (refusing to go below zero),
 *   2. increases the destination location,
 *   3. writes one StockLedger entry with before/after snapshots.
 * Callers must pass a transaction session (see utils/transaction.js) so that a
 * multi-line operation commits or rolls back as a whole.
 */
import Delivery from '../models/Delivery.js';
import InternalTransfer from '../models/InternalTransfer.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import StockQuant from '../models/StockQuant.js';
import ApiError from '../utils/ApiError.js';
import { toObjectId } from './lookup.service.js';

// Avoid floating point drift such as 0.1 + 0.2 = 0.30000000000000004.
const round = (n) => Math.round(n * 1000) / 1000;

async function productLabel(productId, session) {
  const p = await Product.findById(productId).select('name sku').session(session).lean();
  return p ? `[${p.sku}] ${p.name}` : 'product';
}

async function increase(productId, location, qty, session) {
  const quant = await StockQuant.findOneAndUpdate(
    { product: productId, location: location._id },
    { $inc: { quantity: qty }, $setOnInsert: { warehouse: location.warehouse._id ?? location.warehouse } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: false, session }
  );
  return { before: round(quant.quantity - qty), after: round(quant.quantity) };
}

async function decrease(productId, location, qty, session) {
  const quant = await StockQuant.findOneAndUpdate(
    { product: productId, location: location._id, quantity: { $gte: qty } },
    { $inc: { quantity: -qty } },
    { returnDocument: 'after', session }
  );
  if (!quant) {
    const current = await StockQuant.findOne({ product: productId, location: location._id })
      .session(session)
      .lean();
    throw ApiError.badRequest(
      `Insufficient stock for ${await productLabel(productId, session)} at ${location.fullName}: ` +
        `available ${round(current?.quantity ?? 0)}, required ${qty}`
    );
  }
  return { before: round(quant.quantity + qty), after: round(quant.quantity) };
}

/**
 * Moves `quantity` of `product` from `from` to `to` (Location documents; either may be null
 * for stock entering or leaving the company) and records it in the ledger.
 */
export async function moveStock({
  product,
  quantity,
  from = null,
  to = null,
  refType,
  refId = null,
  reference = '',
  contact = '',
  note = '',
  user,
  session,
}) {
  const qty = round(Number(quantity));
  if (!(qty > 0)) throw ApiError.badRequest('Quantity must be greater than 0');
  if (!from && !to) throw ApiError.badRequest('A stock move needs a source or a destination');
  if (from && to && String(from._id) === String(to._id)) {
    throw ApiError.badRequest('Source and destination must be different locations');
  }

  const productId = product._id ?? product;
  const out = from ? await decrease(productId, from, qty, session) : null;
  const inc = to ? await increase(productId, to, qty, session) : null;

  const warehouses = [from, to]
    .filter(Boolean)
    .map((loc) => String(loc.warehouse._id ?? loc.warehouse));

  const [entry] = await StockLedger.create(
    [
      {
        product: productId,
        quantity: qty,
        direction: from && to ? 'internal' : to ? 'in' : 'out',
        fromLocation: from?._id ?? null,
        toLocation: to?._id ?? null,
        warehouses: [...new Set(warehouses)],
        fromQtyBefore: out?.before,
        fromQtyAfter: out?.after,
        toQtyBefore: inc?.before,
        toQtyAfter: inc?.after,
        refType,
        refId,
        reference,
        contact,
        note,
        performedBy: user?._id,
      },
    ],
    { session }
  );
  return entry;
}

/** Current quantity of one product at one location (0 if never stocked). */
export async function getQuantityAt(productId, locationId, session = null) {
  const quant = await StockQuant.findOne({ product: productId, location: locationId })
    .session(session)
    .lean();
  return quant?.quantity ?? 0;
}

/**
 * On-hand totals per product: Map<productId, quantity>.
 * Optional filters: products (ids), warehouse, location.
 */
export async function getOnHandByProduct({ products, warehouse, location } = {}) {
  const match = {};
  if (products) match.product = { $in: products.map(toObjectId) };
  if (warehouse) match.warehouse = toObjectId(warehouse);
  if (location) match.location = toObjectId(location);

  const rows = await StockQuant.aggregate([
    { $match: match },
    { $group: { _id: '$product', quantity: { $sum: '$quantity' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), round(r.quantity)]));
}

/**
 * Stock reserved by deliveries and transfers in "ready" status, per product and source location.
 * Returns [{ product, location, quantity }]. `exclude` skips one document (the one being checked).
 */
export async function getReserved({ products, warehouse, location, exclude } = {}) {
  const match = { status: 'ready' };
  if (warehouse) match.warehouse = toObjectId(warehouse);
  if (location) match.sourceLocation = toObjectId(location);
  if (exclude) match._id = { $ne: toObjectId(exclude) };

  const pipeline = [
    { $match: match },
    { $unwind: '$lines' },
    ...(products ? [{ $match: { 'lines.product': { $in: products.map(toObjectId) } } }] : []),
    {
      $group: {
        _id: { product: '$lines.product', location: '$sourceLocation' },
        quantity: { $sum: '$lines.quantity' },
      },
    },
  ];

  const [fromDeliveries, fromTransfers] = await Promise.all([
    Delivery.aggregate(pipeline),
    InternalTransfer.aggregate(pipeline),
  ]);

  const totals = new Map();
  for (const row of [...fromDeliveries, ...fromTransfers]) {
    const key = `${row._id.product}:${row._id.location}`;
    totals.set(key, (totals.get(key) ?? 0) + row.quantity);
  }
  return [...totals].map(([key, quantity]) => {
    const [product, loc] = key.split(':');
    return { product, location: loc, quantity: round(quantity) };
  });
}

/** Sums getReserved() rows per product: Map<productId, quantity>. */
export function sumReservedByProduct(rows) {
  const map = new Map();
  for (const r of rows) map.set(r.product, round((map.get(r.product) ?? 0) + r.quantity));
  return map;
}

/**
 * Availability of each line at a source location, ignoring reservations made by `excludeId`.
 * Returns [{ product, quantity, onHand, reserved, available, inStock }].
 */
export async function checkAvailability({ locationId, lines, excludeId }) {
  const products = lines.map((l) => String(l.product._id ?? l.product));
  const [onHand, reservedRows] = await Promise.all([
    getOnHandByProduct({ products, location: locationId }),
    getReserved({ products, location: locationId, exclude: excludeId }),
  ]);
  const reserved = sumReservedByProduct(reservedRows);

  return lines.map((line, i) => {
    const product = products[i];
    const have = onHand.get(product) ?? 0;
    const held = reserved.get(product) ?? 0;
    const available = round(Math.max(have - held, 0));
    return { product, quantity: line.quantity, onHand: have, reserved: held, available, inStock: available >= line.quantity };
  });
}

/** Stock status for a product given its on-hand quantity and reordering rule. */
export function stockStatus(onHand, reorderLevel = 0) {
  if (onHand <= 0) return 'out';
  if (reorderLevel > 0 && onHand <= reorderLevel) return 'low';
  return 'in';
}

export { round };
