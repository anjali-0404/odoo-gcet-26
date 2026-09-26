import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

export async function list() {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([
      { $match: { isActive: true, category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) ?? 0 }));
}

export async function create(data) {
  return Category.create(data);
}

export async function update(id, data) {
  const category = await Category.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

export async function remove(id) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found');
  if (await Product.exists({ category: id })) {
    throw ApiError.conflict('This category is used by products; reassign them first');
  }
  await category.deleteOne();
  return { _id: category._id };
}
