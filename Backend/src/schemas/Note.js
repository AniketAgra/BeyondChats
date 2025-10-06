import mongoose from 'mongoose';

const { Schema, Types } = mongoose

const NoteSchema = new Schema(
  {
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['text', 'audio'], required: true },
    content: { type: String, required: true }, // text content or base64 audio
    page: Number,
  pdfId: { type: Types.ObjectId, ref: 'Pdf', index: true },
  },
  { timestamps: true }
);

NoteSchema.index({ user: 1, pdfId: 1, createdAt: -1 })

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
