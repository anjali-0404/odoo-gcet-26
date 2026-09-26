import mongoose from 'mongoose';
import { operationFields, operationLineSchema, ref, schemaOptions } from './common.js';

/** Outgoing goods to a customer. Validating decreases stock at sourceLocation. */
const deliverySchema = new mongoose.Schema(
  {
    ...operationFields(),
    contact: { type: String, trim: true, maxlength: 120, default: '' },
    deliveryAddress: { type: String, trim: true, maxlength: 300, default: '' },
    sourceLocation: { ...ref('Location'), required: true },
    lines: { type: [operationLineSchema], default: [] },
    pickedAt: Date,
    packedAt: Date,
  },
  schemaOptions
);

export default mongoose.model('Delivery', deliverySchema);
