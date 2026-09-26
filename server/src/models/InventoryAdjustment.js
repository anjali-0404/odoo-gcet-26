import mongoose from 'mongoose';
import { operationFields, ref, schemaOptions } from './common.js';

const adjustmentLineSchema = new mongoose.Schema({
  product: { ...ref('Product'), required: true },
  countedQuantity: { type: Number, required: true, min: [0, 'Counted quantity cannot be negative'] },
  // Recorded stock and difference (counted - system). Snapshotted when the
  // adjustment is created and recalculated at validation time.
  systemQuantity: { type: Number, default: 0 },
  difference: { type: Number, default: 0 },
});

/** Physical count at one location. Validating sets stock to the counted quantity. */
const inventoryAdjustmentSchema = new mongoose.Schema(
  {
    ...operationFields(),
    location: { ...ref('Location'), required: true },
    reason: { type: String, trim: true, maxlength: 300, default: '' },
    lines: { type: [adjustmentLineSchema], default: [] },
  },
  schemaOptions
);

export default mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);
