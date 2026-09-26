import mongoose from 'mongoose';
import { ref, schemaOptions } from './common.js';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    warehouse: { ...ref('Warehouse'), required: true },
    // "<WAREHOUSE_CODE>/<name>", e.g. "WH/Stock". Kept in sync by the warehouse service.
    fullName: { type: String, required: true },
    // Every warehouse gets one default location ("Stock") on creation.
    isDefault: { type: Boolean, default: false },
  },
  schemaOptions
);

locationSchema.index({ warehouse: 1, code: 1 }, { unique: true });

export default mongoose.model('Location', locationSchema);
