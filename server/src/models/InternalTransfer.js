import mongoose from 'mongoose';
import { operationFields, operationLineSchema, ref, schemaOptions } from './common.js';

/** Moves stock between two locations. Total stock is unchanged. */
const internalTransferSchema = new mongoose.Schema(
  {
    ...operationFields(),
    sourceLocation: { ...ref('Location'), required: true },
    destLocation: { ...ref('Location'), required: true },
    lines: { type: [operationLineSchema], default: [] },
  },
  schemaOptions
);

export default mongoose.model('InternalTransfer', internalTransferSchema);
