import Category from '../models/Category.js';
import Location from '../models/Location.js';
import Product from '../models/Product.js';
import StockQuant from '../models/StockQuant.js';
import Warehouse from '../models/Warehouse.js';
import ApiError from '../utils/ApiError.js';
import { containsRegex, paginateArray, paginated } from '../utils/query.js';
import { runInTransaction } from '../utils/transaction.js';
import { getLocationOrFail } from './lookup.service.js';
import {
  getOnHandByProduct,
  getReserved,
  moveStock,
  round,
  stockStatus,
  sumReservedByProduct,
} from './stock.service.js';

async function assertCategoryExists(id) {
  if (id && !(await Category.exists({ _id: id }))) throw ApiError.badRequest('Category not found');
}

/** Adds onHand / reserved / freeToUse / stockStatus to plain product objects. */
async function withStock(products, { warehouse } = {}) {
  const ids = products.map((p) => String(p._id));
  const [onHand, reservedRows] = await Promise.all([
    getOnHandByProduct({ products: ids, warehouse }),
    getReserved({ products: ids, warehouse }),
  ]);
  const reserved = sumReservedByProduct(reservedRows);

  return products.map((p) => {
    const qty = onHand.get(String(p._id)) ?? 0;
    const held = reserved.get(String(p._id)) ?? 0;
    return {
      ...p,
      onHand: qty,
      reserved: held,
      freeToUse: round(Math.max(qty - held, 0)),
      stockStatus: stockStatus(qty, p.reorderLevel),
    };
  });
}

/**
 * Lists products with stock figures. Stock totals are computed per request, so
 * filtering by stockStatus and pagination happen in memory (fine at hackathon scale).
 */
export async function list(query) {
  const filter = {};
  if (query.includeInactive !== 'true') filter.isActive = true;
  if (query.category) filter.category = query.category;
  if (query.search) {
    const rx = containsRegex(query.search);
    filter.$or = [{ name: rx }, { sku: rx }];
  }

  const products = await Product.find(filter).populate('category', 'name').sort({ name: 1 }).lean();
  let items = await withStock(products, { warehouse: query.warehouse });
  if (query.stockStatus) items = items.filter((p) => p.stockStatus === query.stockStatus);
  return paginateArray(items, query);
}

export async function getById(id) {
  const product = await Product.findById(id).populate('category', 'name').lean();
  if (!product) throw ApiError.notFound('Product not found');

  const [withTotals] = await withStock([product]);
  const [quants, reservedRows] = await Promise.all([
    StockQuant.find({ product: id })
      .populate('location', 'name code fullName')
      .populate('warehouse', 'name code')
      .sort({ quantity: -1 })
      .lean(),
    getReserved({ products: [id] }),
  ]);
  const reservedAt = new Map(reservedRows.map((r) => [r.location, r.quantity]));

  withTotals.stockByLocation = quants.map((q) => {
    const held = reservedAt.get(String(q.location._id)) ?? 0;
    return {
      location: q.location,
      warehouse: q.warehouse,
      quantity: q.quantity,
      reserved: held,
      freeToUse: round(Math.max(q.quantity - held, 0)),
    };
  });
  return withTotals;
}

/** Default location for initial stock: the default location of the oldest warehouse. */
async function defaultLocationId() {
  const warehouse = await Warehouse.findOne().sort({ createdAt: 1 }).lean();
  if (!warehouse) throw ApiError.badRequest('Create a warehouse before adding initial stock');
  const location = await Location.findOne({ warehouse: warehouse._id, isDefault: true }).lean();
  if (!location) throw ApiError.badRequest('The first warehouse has no default location');
  return location._id;
}

export async function create(data, user) {
  const { initialStock, ...fields } = data;
  await assertCategoryExists(fields.category);

  const hasInitialStock = initialStock?.quantity > 0;
  const locationId = hasInitialStock ? initialStock.location ?? (await defaultLocationId()) : null;

  const productId = await runInTransaction(async (session) => {
    const [product] = await Product.create([fields], { session });
    if (hasInitialStock) {
      const location = await getLocationOrFail(locationId, 'Initial stock location', session);
      await moveStock({
        product: product._id,
        quantity: initialStock.quantity,
        to: location,
        refType: 'initial',
        refId: product._id,
        reference: 'Initial stock',
        user,
        session,
      });
    }
    return product._id;
  });
  return getById(productId);
}

export async function update(id, data) {
  await assertCategoryExists(data.category);
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  product.set(data);
  await product.save();
  return getById(id);
}

/** Archives the product (soft delete) so historic operations and ledger entries stay valid. */
export async function archive(id) {
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
  if (!product) throw ApiError.notFound('Product not found');
  return { _id: product._id, isActive: false };
}

/** Stock per product and location (quants). */
export async function listStock(query) {
  const filter = {};
  if (query.includeZero !== 'true') filter.quantity = { $gt: 0 };
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.location) filter.location = query.location;

  if (query.product || query.search || query.category) {
    const productFilter = {};
    if (query.product) productFilter._id = query.product;
    if (query.category) productFilter.category = query.category;
    if (query.search) {
      const rx = containsRegex(query.search);
      productFilter.$or = [{ name: rx }, { sku: rx }];
    }
    const ids = await Product.find(productFilter).distinct('_id');
    filter.product = { $in: ids };
  }

  const { page, limit } = query;
  const [quants, total] = await Promise.all([
    StockQuant.find(filter)
      .populate('product', 'name sku uom unitCost reorderLevel')
      .populate('location', 'name code fullName')
      .populate('warehouse', 'name code')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StockQuant.countDocuments(filter),
  ]);

  const reservedRows = await getReserved({ products: quants.map((q) => String(q.product._id)) });
  const reservedAt = new Map(reservedRows.map((r) => [`${r.product}:${r.location}`, r.quantity]));

  const items = quants.map((q) => {
    const held = reservedAt.get(`${q.product._id}:${q.location._id}`) ?? 0;
    return { ...q, reserved: held, freeToUse: round(Math.max(q.quantity - held, 0)) };
  });
  return paginated(items, total, { page, limit });
}
