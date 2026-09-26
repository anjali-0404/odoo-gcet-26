import mongoose from 'mongoose';
import { schemaOptions } from './common.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
  },
  schemaOptions
);

// Case-insensitive uniqueness ("Furniture" == "furniture").
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Category', categorySchema);
