import { Router } from 'express';
import Notes from '../schemas/Note.js';
import { requireAuth } from '../middlewares/auth.js'

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.query;
    const query = { user: req.user._id }
    if (pdfId) query.pdfId = pdfId
    const items = (await Notes.find?.(query).sort({ createdAt: -1 })) || [];
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, content, page, pdfId } = req.body; // { type, content, page, pdfId }
    if (!type || !content) return res.status(400).json({ error: 'Missing fields' })
    const saved = (await Notes.create?.({ user: req.user._id, type, content, page, pdfId })) || {
      user: req.user._id, type, content, page, pdfId
    };
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
