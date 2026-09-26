import mongoose from 'mongoose';
import { ref, schemaOptions } from './common.js';

/**
 * Current on-hand quantity of one product at one location.
 * Only services/stock.service.js writes to this collection.
 */
const stockQuantSchema = new mongoose.Schema(
  {
    product: { ...ref('Product'), required: true },
    location: { ...ref('Location'), required: true },
    warehouse: { ...ref('Warehouse'), required: true },
    quantity: { type: Number, required: true, min: [0, 'Stock cannot go negative'], default: 0 },
  },
  schemaOptions
);

stockQuantSchema.index({ product: 1, location: 1 }, { unique: true });
stockQuantSchema.index({ warehouse: 1 });

export default mongoose.model('StockQuant', stockQuantSchema);
