import Delivery from '../models/Delivery.js';
import InternalTransfer from '../models/InternalTransfer.js';
import InventoryAdjustment from '../models/InventoryAdjustment.js';
import Product from '../models/Product.js';
import Receipt from '../models/Receipt.js';
import { OPEN_STATUSES } from '../models/common.js';
import { containsRegex, endOfToday, paginateArray, startOfToday } from '../utils/query.js';
import { toObjectId } from './lookup.service.js';
import { getOnHandByProduct, round, stockStatus } from './stock.service.js';

const MODELS = {
  receipt: Receipt,
  delivery: Delivery,
  transfer: InternalTransfer,
  adjustment: InventoryAdjustment,
};

async function productIdsInCategory(category) {
  return category ? Product.find({ category }).distinct('_id') : null;
}

/** Match stage shared by the operation counters and the operations list. */
function operationMatch({ warehouse, productIds, status }) {
  const match = {};
  if (status) match.status = { $in: status };
  if (warehouse) match.warehouse = toObjectId(warehouse);
  if (productIds) match['lines.product'] = { $in: productIds };
  return match;
}

/** Counts of open documents: pending / draft / waiting / ready / late / upcoming. */
async function countOpen(Model, filters) {
  const today = startOfToday();
  const tomorrow = endOfToday();
  const when = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });

  const [row] = await Model.aggregate([
    { $match: operationMatch({ ...filters, status: OPEN_STATUSES }) },
    {
      $group: {
        _id: null,
        pending: { $sum: 1 },
        draft: when({ $eq: ['$status', 'draft'] }),
        waiting: when({ $eq: ['$status', 'waiting'] }),
        ready: when({ $eq: ['$status', 'ready'] }),
        late: when({ $lt: ['$scheduledDate', today] }),
        upcoming: when({ $gt: ['$scheduledDate', tomorrow] }),
      },
    },
  ]);
  const { _id, ...counts } = row ?? {};
  return { pending: 0, draft: 0, waiting: 0, ready: 0, late: 0, upcoming: 0, ...counts };
}

const LOW_STOCK_LIST_SIZE = 10;

export async function summary({ warehouse, category }) {
  const productIds = await productIdsInCategory(category);

  const products = await Product.find({ isActive: true, ...(category && { category }) })
    .select('name sku uom reorderLevel')
    .lean();
  const onHand = await getOnHandByProduct({ products: products.map((p) => String(p._id)), warehouse });

  const stock = { total: products.length, inStock: 0, lowStock: 0, outOfStock: 0, totalQuantity: 0 };
  const alerts = [];
  for (const p of products) {
    const qty = onHand.get(String(p._id)) ?? 0;
    const status = stockStatus(qty, p.reorderLevel);
    stock.totalQuantity += qty;
    if (qty > 0) stock.inStock += 1;
    if (status === 'low') stock.lowStock += 1;
    if (status === 'out') stock.outOfStock += 1;
    if (status !== 'in') alerts.push({ ...p, onHand: qty, stockStatus: status });
  }
  stock.totalQuantity = round(stock.totalQuantity);
  alerts.sort((a, b) => a.onHand - b.onHand);

  const filters = { warehouse, productIds };
  const [receipts, deliveries, transfers, adjustments] = await Promise.all([
    countOpen(Receipt, filters),
    countOpen(Delivery, filters),
    countOpen(InternalTransfer, filters),
    countOpen(InventoryAdjustment, filters),
  ]);

  return {
    products: stock,
    lowStockItems: alerts.slice(0, LOW_STOCK_LIST_SIZE),
    receipts,
    deliveries,
    transfers,
    adjustments: { pending: adjustments.pending },
  };
}

const locationName = (loc) => loc?.fullName ?? null;

/** Normalises any operation document into one row shape for the combined list. */
function toRow(type, doc) {
  const base = {
    _id: doc._id,
    type,
    reference: doc.reference,
    status: doc.status,
    contact: doc.contact ?? '',
    scheduledDate: doc.scheduledDate,
    warehouse: doc.warehouse,
    productCount: doc.lines.length,
    totalQuantity: round(doc.lines.reduce((sum, l) => sum + (l.quantity ?? l.countedQuantity ?? 0), 0)),
    createdAt: doc.createdAt,
  };
  switch (type) {
    case 'receipt':
      return { ...base, from: doc.contact || 'Vendor', to: locationName(doc.destLocation) };
    case 'delivery':
      return { ...base, from: locationName(doc.sourceLocation), to: doc.contact || 'Customer' };
    case 'transfer':
      return { ...base, from: locationName(doc.sourceLocation), to: locationName(doc.destLocation) };
    default:
      return { ...base, from: locationName(doc.location), to: locationName(doc.location) };
  }
}

const LOCATION_PATHS = {
  receipt: ['destLocation'],
  delivery: ['sourceLocation'],
  transfer: ['sourceLocation', 'destLocation'],
  adjustment: ['location'],
};

/** Documents of every (or the selected) operation type, merged and sorted by scheduled date. */
export async function operations(query) {
  const types = query.type ?? Object.keys(MODELS);
  const productIds = await productIdsInCategory(query.category);
  const match = operationMatch({ warehouse: query.warehouse, productIds, status: query.status });
  if (query.search) {
    const rx = containsRegex(query.search);
    match.$or = [{ reference: rx }, { contact: rx }];
  }

  const results = await Promise.all(
    types.map(async (type) => {
      const docs = await MODELS[type]
        .find(match)
        .populate('warehouse', 'name code')
        .populate(LOCATION_PATHS[type].map((path) => ({ path, select: 'name fullName' })))
        .lean();
      return docs.map((doc) => toRow(type, doc));
    })
  );

  const rows = results.flat().sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
  return paginateArray(rows, query);
}
