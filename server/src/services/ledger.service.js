import StockLedger from '../models/StockLedger.js';
import { containsRegex, paginated } from '../utils/query.js';

const POPULATE = [
  { path: 'product', select: 'name sku uom' },
  { path: 'fromLocation', select: 'name code fullName' },
  { path: 'toLocation', select: 'name code fullName' },
  { path: 'performedBy', select: 'name loginId' },
];

export async function list(query) {
  const filter = {};
  if (query.product) filter.product = query.product;
  if (query.warehouse) filter.warehouses = query.warehouse;
  if (query.location) filter.$or = [{ fromLocation: query.location }, { toLocation: query.location }];
  if (query.refType) filter.refType = { $in: query.refType };
  if (query.direction) filter.direction = query.direction;
  if (query.search) {
    const rx = containsRegex(query.search);
    filter.$and = [{ $or: [{ reference: rx }, { contact: rx }] }];
  }
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = query.dateFrom;
    if (query.dateTo) filter.createdAt.$lte = query.dateTo;
  }

  const { page, limit } = query;
  const [items, total] = await Promise.all([
    StockLedger.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    StockLedger.countDocuments(filter),
  ]);
  return paginated(items, total, { page, limit });
}
