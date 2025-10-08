import mongoose from 'mongoose'

const { Schema, Types } = mongoose

/**
 * SessionMessage Schema
 * Individual messages within a ChatSession (both PDF and general AI Study Buddy)
 */
const SessionMessageSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'ai', 'system'], required: true },
    content: { type: String, required: true },
    
    // Message metadata
    meta: {
      // For AI responses
      aiGenerated: { type: Boolean, default: false },
      hasContext: { type: Boolean, default: false },
      memoryUsed: { type: Boolean, default: false },
      ragUsed: { type: Boolean, default: false },
      
      // Source information
      sources: [{
        type: { type: String, enum: ['pdf', 'quiz', 'note', 'memory'] },
        id: String,
        relevance: Number,
        excerpt: String
      }],
      
      // Performance context (for AI Study Buddy)
      performanceContext: {
        quizScore: Number,
        weakTopics: [String],
        studyTime: Number
      },
      
      // Vector search metadata
      vectorSearch: {
        query: String,
        topMatches: Number,
        namespace: String
      }
    }
  },
  { timestamps: true }
)

// Indexes for efficient queries
SessionMessageSchema.index({ sessionId: 1, createdAt: 1 })
SessionMessageSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.SessionMessage || mongoose.model('SessionMessage', SessionMessageSchema)
