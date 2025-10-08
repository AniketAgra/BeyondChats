import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const TopicPerformanceSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    pdf: { type: Types.ObjectId, ref: 'Pdf', required: true, index: true },
    
    // Topic name (can be main topic or subtopic)
    topic: { type: String, required: true, index: true },
    
    // Performance metrics
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    
    // Calculated accuracy percentage
    accuracy: { type: Number, default: 0 },
    
    // Categorization
    category: { 
      type: String, 
      enum: ['strong', 'moderate', 'weak', 'not-attempted'],
      default: 'not-attempted'
    },
    
    // Last activity
    lastAttemptDate: { type: Date, default: Date.now },
    
    // Question IDs associated with this topic
    questionIds: { type: [String], default: [] }
  },
  { timestamps: true }
)

// Indexes for efficient querying
TopicPerformanceSchema.index({ user: 1, pdf: 1, topic: 1 }, { unique: true })
TopicPerformanceSchema.index({ user: 1, category: 1 })
TopicPerformanceSchema.index({ pdf: 1, category: 1 })

// Method to update performance
TopicPerformanceSchema.methods.updatePerformance = function(isCorrect, questionId) {
  this.totalQuestions += 1
  if (isCorrect) {
    this.correctAnswers += 1
  } else {
    this.incorrectAnswers += 1
  }
  
  // Calculate accuracy
  this.accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100)
  
  // Update category based on accuracy
  if (this.accuracy >= 80) {
    this.category = 'strong'
  } else if (this.accuracy >= 60) {
    this.category = 'moderate'
  } else {
    this.category = 'weak'
  }
  
  this.lastAttemptDate = new Date()
  
  // Add question ID if not already present
  if (questionId && !this.questionIds.includes(questionId)) {
    this.questionIds.push(questionId)
  }
}

export default mongoose.models.TopicPerformance || mongoose.model('TopicPerformance', TopicPerformanceSchema)
