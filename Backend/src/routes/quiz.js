import { Router } from 'express';
import { generateQuiz, submitQuiz } from '../services/quizService.js';
import QuizAttempt from '../schemas/QuizAttempt.js'
import Pdf from '../schemas/Pdf.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router();

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { text, pdfId, difficulty = 'medium', types = ['MCQ'], topic, count = 10 } = req.body || {};
    
    let contentText = text;
    
    // If pdfId is provided, fetch the PDF content
    if (pdfId && !contentText) {
      const pdf = await Pdf.findById(pdfId);
      if (pdf && pdf.extractedText) {
        contentText = pdf.extractedText;
      }
    }
    
    const quiz = await generateQuiz({ 
      text: contentText, 
      pdfId,
      difficulty, 
      types, 
      topic,
      count 
    });
    
    res.json(quiz);
  } catch (e) {
    console.error('Quiz generation error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { questions, responses, topic, difficulty, pdfId } = req.body || {}
    const result = await submitQuiz({ questions, responses });
    
    // Store attempt
    await QuizAttempt.create({
      user: req.user._id,
      pdf: pdfId || null,
      topic,
      difficulty,
      score: result.score,
      correct: result.correct,
      total: result.total,
    })
    
    res.json(result);
  } catch (e) {
    console.error('Quiz submission error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get quiz attempts for a user
router.get('/attempts', requireAuth, async (req, res) => {
  try {
    const { pdfId, limit = 50 } = req.query;
    const query = { user: req.user._id };
    if (pdfId) query.pdf = pdfId;
    
    const attempts = await QuizAttempt.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('pdf', 'title filename');
    
    res.json({ attempts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
