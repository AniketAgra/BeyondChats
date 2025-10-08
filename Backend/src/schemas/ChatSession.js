import mongoose from 'mongoose'

const { Schema, Types } = mongoose

/**
 * ChatSession Schema
 * Represents a chat conversation thread - can be PDF-specific or general AI Study Buddy
 */
const ChatSessionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Chat' },
    type: { 
      type: String, 
      enum: ['pdf', 'general'], 
      required: true,
      index: true 
    },
    pdfId: { 
      type: Types.ObjectId, 
      ref: 'Pdf',
      // Required only for PDF-specific chats
      required: function() { return this.type === 'pdf' }
    },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    
    // Context & Memory
    context: {
      topics: [String],  // Topics discussed
      weakTopics: [String],  // Weak topics identified from quizzes
      quizPerformance: {
        totalAttempts: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        weakAreas: [String]
      }
    },
    
    // Metadata
    meta: {
      pdfTitle: String,
      sessionType: String,
      tags: [String]
    }
  },
  { timestamps: true }
)

// Indexes for efficient queries
ChatSessionSchema.index({ user: 1, type: 1, lastMessageAt: -1 })
ChatSessionSchema.index({ user: 1, pdfId: 1 })
ChatSessionSchema.index({ user: 1, isActive: 1, lastMessageAt: -1 })

// Virtual for getting messages
ChatSessionSchema.virtual('messages', {
  ref: 'SessionMessage',
  localField: '_id',
  foreignField: 'sessionId'
})

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema)
