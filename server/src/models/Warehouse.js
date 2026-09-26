import mongoose from 'mongoose';
import { schemaOptions } from './common.js';

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Short code, used as the reference prefix: WH/IN/0001
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 10 },
    address: { type: String, trim: true, maxlength: 300, default: '' },
  },
  schemaOptions
);

export default mongoose.model('Warehouse', warehouseSchema);
