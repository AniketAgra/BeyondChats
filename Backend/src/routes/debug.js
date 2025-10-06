import { Router } from 'express'
import { ensureClient, getBucket } from '../config/supabase.js'

const router = Router()

router.get('/storage', async (req, res) => {
  try {
    // Simple bucket existence check via a list call (first page)
    const bucket = getBucket()
  const supabase = ensureClient()
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 })
    if (error) throw error
    res.json({ ok: true, bucket, sample: data })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

export default router
