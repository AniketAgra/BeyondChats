import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import QuizAttempt from '../schemas/QuizAttempt.js'

const router = Router()

router.get('/overview', requireAuth, async (req, res) => {
  try {
    // recent quiz scores last 7 entries
    const recent = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(7)
      .lean()
    const series = recent.map(a => ({ date: a.createdAt, score: a.score, topic: a.topic }))
    res.json({ recent: series })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
