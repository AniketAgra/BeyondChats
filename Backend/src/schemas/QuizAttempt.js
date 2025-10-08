import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const QuizAttemptSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    quiz: { type: Types.ObjectId, ref: 'Quiz', index: true }, // Reference to Quiz (optional - not all quizzes are saved)
    pdf: { type: Types.ObjectId, ref: 'Pdf', index: true },
    topic: { type: String },
    difficulty: { type: String },
    score: { type: Number, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    questions: { type: Array, default: [] }, // Store quiz questions (for this attempt)
    responses: { type: Array, default: [] }, // Store user responses
    results: { type: Array, default: [] }, // Store detailed results
    isReattempt: { type: Boolean, default: false }, // Flag to indicate if this is a reattempt
    originalAttemptId: { type: Types.ObjectId, ref: 'QuizAttempt', index: true }, // Reference to original attempt if reattempt
  },
  { timestamps: true }
)

QuizAttemptSchema.index({ user: 1, createdAt: -1 })
QuizAttemptSchema.index({ user: 1, pdf: 1 })
QuizAttemptSchema.index({ user: 1, quiz: 1 })

export default mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema)
