import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const PdfSchema = new Schema(
  {
    // Ownership
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    // Legacy fields (keep for backward compatibility with existing data)
    url: { type: String }, // old field name for pdf url
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    cloudinaryPublicId: String,

    // New metadata fields
    title: { type: String, required: true },
    author: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    pdfUrl: { type: String, required: true },
    chapters: { type: [String], default: [] },
    summary: { type: String, default: '' }
  },
  { timestamps: true }
)

// Common listing pattern: newest first per user
PdfSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.Pdf || mongoose.model('Pdf', PdfSchema)
