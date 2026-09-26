import Delivery from '../models/Delivery.js';
import InternalTransfer from '../models/InternalTransfer.js';
import InventoryAdjustment from '../models/InventoryAdjustment.js';
import Location from '../models/Location.js';
import Receipt from '../models/Receipt.js';
import StockLedger from '../models/StockLedger.js';
import StockQuant from '../models/StockQuant.js';
import Warehouse from '../models/Warehouse.js';
import ApiError from '../utils/ApiError.js';
import { runInTransaction } from '../utils/transaction.js';

const DEFAULT_LOCATION = { name: 'Stock', code: 'STOCK' };

const fullNameOf = (warehouseCode, locationName) => `${warehouseCode}/${locationName}`;

// ---------------------------------------------------------------- Warehouses

export async function listWarehouses() {
  const [warehouses, counts] = await Promise.all([
    Warehouse.find().sort({ name: 1 }).lean(),
    Location.aggregate([{ $group: { _id: '$warehouse', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return warehouses.map((w) => ({ ...w, locationCount: countMap.get(String(w._id)) ?? 0 }));
}

export async function getWarehouse(id) {
  const warehouse = await Warehouse.findById(id).lean();
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  const locations = await Location.find({ warehouse: id }).sort({ isDefault: -1, name: 1 }).lean();
  return { ...warehouse, locations };
}

/** Creates the warehouse together with its default "Stock" location. */
export async function createWarehouse(data) {
  const id = await runInTransaction(async (session) => {
    const [warehouse] = await Warehouse.create([data], { session });
    await Location.create(
      [
        {
          ...DEFAULT_LOCATION,
          warehouse: warehouse._id,
          fullName: fullNameOf(warehouse.code, DEFAULT_LOCATION.name),
          isDefault: true,
        },
      ],
      { session }
    );
    return warehouse._id;
  });
  return getWarehouse(id);
}

export async function updateWarehouse(id, data) {
  const warehouse = await Warehouse.findById(id);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  const codeChanged = data.code && data.code !== warehouse.code;

  warehouse.set(data);
  await warehouse.save();

  if (codeChanged) {
    // Keep "<CODE>/<name>" location names in sync. Existing references (WH/IN/0001) keep their prefix.
    const locations = await Location.find({ warehouse: id }).select('name').lean();
    await Location.bulkWrite(
      locations.map((l) => ({
        updateOne: { filter: { _id: l._id }, update: { fullName: fullNameOf(warehouse.code, l.name) } },
      }))
    );
  }
  return getWarehouse(id);
}

async function isReferenced({ warehouse, location }) {
  const byWarehouse = { warehouse };
  const checks = warehouse
    ? [
        StockQuant.exists({ warehouse, quantity: { $gt: 0 } }),
        StockLedger.exists({ warehouses: warehouse }),
        Receipt.exists(byWarehouse),
        Delivery.exists(byWarehouse),
        InternalTransfer.exists(byWarehouse),
        InventoryAdjustment.exists(byWarehouse),
      ]
    : [
        StockQuant.exists({ location, quantity: { $gt: 0 } }),
        StockLedger.exists({ $or: [{ fromLocation: location }, { toLocation: location }] }),
        Receipt.exists({ destLocation: location }),
        Delivery.exists({ sourceLocation: location }),
        InternalTransfer.exists({ $or: [{ sourceLocation: location }, { destLocation: location }] }),
        InventoryAdjustment.exists({ location }),
      ];
  return (await Promise.all(checks)).some(Boolean);
}

export async function deleteWarehouse(id) {
  const warehouse = await Warehouse.findById(id);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  if (await isReferenced({ warehouse: id })) {
    throw ApiError.conflict('This warehouse has stock or operation history and cannot be deleted');
  }
  await runInTransaction(async (session) => {
    await StockQuant.deleteMany({ warehouse: id }, { session });
    await Location.deleteMany({ warehouse: id }, { session });
    await Warehouse.deleteOne({ _id: id }, { session });
  });
  return { _id: warehouse._id };
}

// ---------------------------------------------------------------- Locations

export async function listLocations({ warehouse } = {}) {
  const filter = warehouse ? { warehouse } : {};
  return Location.find(filter).populate('warehouse', 'name code').sort({ fullName: 1 }).lean();
}

export async function getLocation(id) {
  const location = await Location.findById(id).populate('warehouse', 'name code').lean();
  if (!location) throw ApiError.notFound('Location not found');
  return location;
}

export async function createLocation(data) {
  const warehouse = await Warehouse.findById(data.warehouse);
  if (!warehouse) throw ApiError.badRequest('Warehouse not found');
  const location = await Location.create({ ...data, fullName: fullNameOf(warehouse.code, data.name) });
  return getLocation(location._id);
}

export async function updateLocation(id, data) {
  const location = await Location.findById(id).populate('warehouse', 'code');
  if (!location) throw ApiError.notFound('Location not found');
  location.set(data);
  location.fullName = fullNameOf(location.warehouse.code, location.name);
  await location.save();
  return getLocation(id);
}

export async function deleteLocation(id) {
  const location = await Location.findById(id);
  if (!location) throw ApiError.notFound('Location not found');
  if (location.isDefault) throw ApiError.conflict('The default location of a warehouse cannot be deleted');
  if (await isReferenced({ location: id })) {
    throw ApiError.conflict('This location has stock or operation history and cannot be deleted');
  }
  await StockQuant.deleteMany({ location: id });
  await location.deleteOne();
  return { _id: location._id };
}
