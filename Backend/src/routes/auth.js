import { Router } from 'express'
import { login, logout, refresh, signup, me } from '../controllers/authController.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
