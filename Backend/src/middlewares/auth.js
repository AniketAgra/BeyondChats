import jwt from 'jsonwebtoken'
import User from '../schemas/User.js'
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
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
