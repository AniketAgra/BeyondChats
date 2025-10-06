import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const QuizAttemptSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String },
    difficulty: { type: String },
    score: { type: Number, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
)

QuizAttemptSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema)
