import { Router } from 'express';
import { suggestVideos } from '../services/youtubeService.js';
import { requireAuth } from '../middlewares/auth.js'

const router = Router();

router.get('/suggest', requireAuth, async (req, res) => {
  try {
    const topic = req.query.topic || '';
    const videos = await suggestVideos(topic);
    res.json({ videos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
