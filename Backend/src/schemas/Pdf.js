import mongoose from 'mongoose'

const PdfSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    cloudinaryPublicId: String
  },
  { timestamps: true }
)

export default mongoose.models.Pdf || mongoose.model('Pdf', PdfSchema)
