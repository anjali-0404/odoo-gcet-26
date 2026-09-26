import mongoose from 'mongoose';
import Location from '../models/Location.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

export const toObjectId = (id) => (id ? new mongoose.Types.ObjectId(String(id)) : id);

/** Loads a location (with its warehouse populated) or throws 400. */
export async function getLocationOrFail(id, label = 'Location', session = null) {
  const location = await Location.findById(id).populate('warehouse', 'name code').session(session);
  if (!location) throw ApiError.badRequest(`${label} not found`);
  return location;
}

/** Ensures every product id exists and is active. */
export async function assertProductsExist(productIds, session = null) {
  const unique = [...new Set(productIds.map(String))];
  if (!unique.length) return;
  const found = await Product.find({ _id: { $in: unique }, isActive: true })
    .select('_id')
    .session(session)
    .lean();
  if (found.length !== unique.length) {
    throw ApiError.badRequest('One or more products do not exist or are archived');
  }
}

export async function assertUserExists(id) {
  if (id && !(await User.exists({ _id: id }))) throw ApiError.badRequest('Responsible user not found');
}
