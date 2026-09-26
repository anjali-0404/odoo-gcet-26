import mongoose from 'mongoose';
import { ref, schemaOptions } from './common.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 40 },
    category: ref('Category'),
    uom: { type: String, trim: true, maxlength: 20, default: 'Units' },
    unitCost: { type: Number, min: 0, default: 0 },
    // Reordering rule: stock at or below reorderLevel counts as "low stock".
    reorderLevel: { type: Number, min: 0, default: 0 },
    reorderQty: { type: Number, min: 0, default: 0 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    isActive: { type: Boolean, default: true },
  },
  schemaOptions
);

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

export default mongoose.model('Product', productSchema);
