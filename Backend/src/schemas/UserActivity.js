import mongoose from 'mongoose'

const { Schema } = mongoose

const UserActivitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, default: 'request' },
  path: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true }
})

export default mongoose.model('UserActivity', UserActivitySchema)
