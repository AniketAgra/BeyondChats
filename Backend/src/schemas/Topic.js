import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const TopicSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    pdf: { type: Types.ObjectId, ref: 'Pdf', required: true, index: true },
    
    // Main topic category (e.g., "React JS", "Python Programming", "Machine Learning")
    mainTopic: { type: String, required: true },
    
    // Subtopics under this main topic (e.g., ["Hooks", "State Management", "Components"])
    subtopics: { type: [String], default: [] },
    
    // Status of topic generation
    status: { 
      type: String, 
      enum: ['pending', 'generating', 'completed', 'failed'], 
      default: 'pending' 
    },
    
    // AI confidence in topic identification (0-1)
    confidence: { type: Number, default: 1 }
  },
  { timestamps: true }
)

// Ensure one topic document per user+pdf
TopicSchema.index({ user: 1, pdf: 1 }, { unique: true })
TopicSchema.index({ mainTopic: 1 })

export default mongoose.models.Topic || mongoose.model('Topic', TopicSchema)
