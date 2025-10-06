import { Router } from 'express';
import Notes from '../schemas/Note.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { pdfId } = req.query;
    const query = pdfId ? { pdfId } : {};
    const items = (await Notes.find?.(query)) || [];
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body; // { type: 'text'|'audio', content, page, pdfId }
    const saved = (await Notes.create?.(data)) || data;
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
