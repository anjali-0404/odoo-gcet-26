import mongoose from 'mongoose';

const { Schema } = mongoose;

export const OPERATION_STATUSES = ['draft', 'waiting', 'ready', 'done', 'canceled'];
/** Statuses in which a document is still "pending" (counts on the dashboard, can be edited). */
export const OPEN_STATUSES = ['draft', 'waiting', 'ready'];

export const schemaOptions = { timestamps: true, versionKey: false };

const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model });

/** One product line on a receipt / delivery / transfer. */
export const operationLineSchema = new Schema({
  product: { ...ref('Product'), required: true },
  quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
});

/** Fields shared by every operation document. */
export function operationFields() {
  return {
    reference: { type: String, required: true, unique: true },
    warehouse: { ...ref('Warehouse'), required: true },
    status: { type: String, enum: OPERATION_STATUSES, default: 'draft', index: true },
    scheduledDate: { type: Date, default: Date.now },
    responsible: ref('User'),
    createdBy: ref('User'),
    validatedBy: ref('User'),
    validatedAt: Date,
    canceledAt: Date,
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
  };
}

export { ref };
