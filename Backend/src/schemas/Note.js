import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['text', 'audio'], required: true },
    content: { type: String, required: true }, // text content or base64 audio
    page: Number,
    pdfId: String,
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
