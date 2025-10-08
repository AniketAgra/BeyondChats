import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const QuizSchema = new Schema(
  {
    pdf: { type: Types.ObjectId, ref: 'Pdf', required: true, index: true },
    topic: { type: String },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    types: { type: [String], default: ['MCQ'] }, // Question types in this quiz
    questions: { 
      type: Array, 
      required: true,
      default: []
      // Each question has: { question, options?, answerIndex?, answer?, keywords?, explanation, type, topics? }
      // topics: array of topic strings that this question relates to
    },
    totalQuestions: { type: Number, required: true },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true }, // Can be deactivated if PDF is deleted
  },
  { timestamps: true }
)

// Indexes for efficient querying
QuizSchema.index({ pdf: 1, difficulty: 1 })
QuizSchema.index({ createdBy: 1, createdAt: -1 })
QuizSchema.index({ pdf: 1, isActive: 1 })

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema)
