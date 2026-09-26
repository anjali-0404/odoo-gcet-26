import mongoose from 'mongoose';
import { ref } from './common.js';

export const LEDGER_REF_TYPES = ['initial', 'receipt', 'delivery', 'transfer', 'adjustment'];
export const LEDGER_DIRECTIONS = ['in', 'out', 'internal'];

/**
 * Append-only record of every stock movement (one entry per product per move).
 *   receipt / initial / positive adjustment: from = null      -> to = location   (direction "in")
 *   delivery / negative adjustment:          from = location  -> to = null       (direction "out")
 *   internal transfer:                       from = location  -> to = location   (direction "internal")
 * Before/after snapshots show the quantity at each affected location.
 */
const stockLedgerSchema = new mongoose.Schema(
  {
    product: { ...ref('Product'), required: true },
    quantity: { type: Number, required: true, min: 0 },
    direction: { type: String, enum: LEDGER_DIRECTIONS, required: true },

    fromLocation: { ...ref('Location'), default: null },
    toLocation: { ...ref('Location'), default: null },
    // Warehouses touched by this move, for warehouse filtering.
    warehouses: [ref('Warehouse')],
    fromQtyBefore: Number,
    fromQtyAfter: Number,
    toQtyBefore: Number,
    toQtyAfter: Number,

    refType: { type: String, enum: LEDGER_REF_TYPES, required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    reference: { type: String, default: '' },
    contact: { type: String, default: '' },
    note: { type: String, default: '' },

    performedBy: ref('User'),
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

stockLedgerSchema.index({ createdAt: -1 });
stockLedgerSchema.index({ product: 1, createdAt: -1 });
stockLedgerSchema.index({ warehouses: 1 });
stockLedgerSchema.index({ refType: 1, refId: 1 });

export default mongoose.model('StockLedger', stockLedgerSchema);
