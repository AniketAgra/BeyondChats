import mongoose from 'mongoose';

const { Schema, Types } = mongoose

const SummarySchema = new Schema(
  {
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  pdfId: { type: Types.ObjectId, ref: 'Pdf', required: true },
    summary: String
  },
  { timestamps: true }
);

// Ensure one summary per user+pdf
SummarySchema.index({ user: 1, pdfId: 1 }, { unique: true })

export default mongoose.models.Summary || mongoose.model('Summary', SummarySchema);
