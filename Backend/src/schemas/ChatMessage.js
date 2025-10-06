import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const ChatMessageSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'ai', 'system'], required: true },
    content: { type: String, required: true },
    pdfId: { type: Types.ObjectId, ref: 'Pdf' },
    meta: { type: Object },
  },
  { timestamps: true }
)

ChatMessageSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema)
