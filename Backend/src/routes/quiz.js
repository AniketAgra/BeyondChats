import { Router } from 'express';
import { generateQuiz, submitQuiz } from '../services/quizService.js';
import QuizAttempt from '../schemas/QuizAttempt.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router();

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { text, difficulty = 'medium', types = ['MCQ'], topic } = req.body || {};
    const quiz = await generateQuiz({ text, difficulty, types, topic });
    res.json(quiz);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { questions, responses, topic, difficulty } = req.body || {}
    const result = await submitQuiz({ questions, responses });
    // store attempt
    await QuizAttempt.create({
      user: req.user._id,
      topic,
      difficulty,
      score: result.score,
      correct: result.correct,
      total: result.total,
    })
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
