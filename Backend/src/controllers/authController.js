import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../schemas/User.js'

const ACCESS_EXPIRES_IN = '15m'
const REFRESH_EXPIRES_IN = '7d'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-access-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret'

function signAccess(user) {
  return jwt.sign({ sub: user._id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  })
}
function signRefresh(user) {
  return jwt.sign({ sub: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  })
}

function setAuthCookies(res, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  })
}

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' })

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash })

    const accessToken = signAccess(user)
    const refreshToken = signRefresh(user)
    user.refreshToken = refreshToken
    await user.save()

    setAuthCookies(res, refreshToken)
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, accessToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Signup failed' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = signAccess(user)
    const refreshToken = signRefresh(user)
    user.refreshToken = refreshToken
    await user.save()

    setAuthCookies(res, refreshToken)
    res.json({ user: { id: user._id, name: user.name, email: user.email }, accessToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
}

export async function refresh(req, res) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken
    if (!token) return res.status(401).json({ error: 'No refresh token' })

  const payload = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })

    // Optional rotation: check matching token
    if (user.refreshToken && user.refreshToken !== token) {
      return res.status(401).json({ error: 'Token mismatch' })
    }

    const newAccess = signAccess(user)
    const newRefresh = signRefresh(user)
    user.refreshToken = newRefresh
    await user.save()
    setAuthCookies(res, newRefresh)

    res.json({ accessToken: newAccess, user: { id: user._id, name: user.name, email: user.email } })
  } catch (err) {
    console.error(err)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export async function logout(req, res) {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET)
        await User.findByIdAndUpdate(payload.sub, { $unset: { refreshToken: 1 } })
      } catch {}
    }
    res.clearCookie('refreshToken', { path: '/api/auth' })
    res.json({ ok: true })
  } catch (err) {
    res.json({ ok: true })
  }
}

export async function me(req, res) {
  const user = req.user
  res.json({ user: { id: user._id, name: user.name, email: user.email } })
}
