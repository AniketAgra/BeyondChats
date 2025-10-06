import { Router } from 'express';
import multer from 'multer';
import { parsePdf, summarizePdf } from '../services/pdfService.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// POST /api/pdf/parse (multipart/form-data with file)
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const result = await parsePdf(req.file.buffer);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pdf/summarize (multipart or JSON {text, pdfId})
router.post('/summarize', upload.single('file'), async (req, res) => {
  try {
    const text = req.body.text;
    const buf = req.file?.buffer;
    const result = await summarizePdf({ text, buffer: buf, pdfId: req.body.pdfId });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
