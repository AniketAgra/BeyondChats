import mongoose from 'mongoose';

const { Schema, Types } = mongoose

const KeyFeaturesSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    pdfId: { type: Types.ObjectId, ref: 'Pdf', required: true },
    keyPoints: { type: [String], default: [] },
    status: { 
      type: String, 
      enum: ['pending', 'generating', 'completed', 'failed'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

// Ensure one key features document per user+pdf
KeyFeaturesSchema.index({ user: 1, pdfId: 1 }, { unique: true })

export default mongoose.models.KeyFeatures || mongoose.model('KeyFeatures', KeyFeaturesSchema);
