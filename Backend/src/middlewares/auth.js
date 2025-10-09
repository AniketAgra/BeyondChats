import jwt from 'jsonwebtoken'
import User from '../schemas/User.js'
import UserActivity from '../schemas/UserActivity.js'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-access-secret'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const payload = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(payload.sub).select('-passwordHash -refreshToken')
    if (!user) return res.status(401).json({ error: 'Invalid token user' })

    req.user = user

    // Log a lightweight activity event so we can compute active time later
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || ''
      const ua = req.headers['user-agent'] || ''
      UserActivity.create({ user: user._id, path: req.path || '', ip, userAgent: ua }).catch(() => {})
    } catch (e) {
      // Swallow logging errors to avoid breaking authenticated routes
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Helper to ensure a document belongs to the current user
export function ensureOwner(model, idParam = 'id') {
  return async function (req, res, next) {
    try {
      const id = req.params?.[idParam]
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const doc = await model.findOne({ _id: id, user: req.user._id }).select('_id')
      if (!doc) return res.status(404).json({ error: 'Not found' })
      next()
    } catch (e) {
      return res.status(404).json({ error: 'Not found' })
    }
  }
}
