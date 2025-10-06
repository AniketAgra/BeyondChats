import { Router } from 'express';
import { generateQuiz, submitQuiz } from '../services/quizService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { text, difficulty = 'medium', types = ['MCQ'], topic } = req.body || {};
    const quiz = await generateQuiz({ text, difficulty, types, topic });
    res.json(quiz);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const result = await submitQuiz(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
