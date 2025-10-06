import mongoose from 'mongoose';

const SummarySchema = new mongoose.Schema(
  {
    pdfId: { type: String, unique: true },
    summary: String
  },
  { timestamps: true }
);

export default mongoose.models.Summary || mongoose.model('Summary', SummarySchema);
