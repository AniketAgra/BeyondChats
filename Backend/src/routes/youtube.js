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
    console.error('YouTube suggest error:', e.message);
    // Check if it's a quota error
    const isQuotaError = e.response?.status === 403 || 
                         e.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded' ||
                         e.message?.includes('quota');
    
    if (isQuotaError) {
      // Return empty array or cached data instead of error
      res.json({ 
        videos: [], 
        warning: 'YouTube API quota exceeded. Videos will be available tomorrow or when quota resets.' 
      });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

export default router;
