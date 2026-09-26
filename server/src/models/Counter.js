import mongoose from 'mongoose';

/** Sequence counters for reference numbers. _id is the prefix, e.g. "WH/IN". */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.model('Counter', counterSchema);
