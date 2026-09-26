import mongoose from 'mongoose';
import { operationFields, operationLineSchema, ref, schemaOptions } from './common.js';

/** Incoming goods from a vendor. Validating increases stock at destLocation. */
const receiptSchema = new mongoose.Schema(
  {
    ...operationFields(),
    contact: { type: String, trim: true, maxlength: 120, default: '' }, // "Receive From"
    destLocation: { ...ref('Location'), required: true },
    lines: { type: [operationLineSchema], default: [] },
  },
  schemaOptions
);

export default mongoose.model('Receipt', receiptSchema);
