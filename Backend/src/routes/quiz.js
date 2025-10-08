import { Router } from 'express';
import { generateQuiz, submitQuiz } from '../services/quizService.js';
import QuizAttempt from '../schemas/QuizAttempt.js'
import Quiz from '../schemas/Quiz.js'
import Pdf from '../schemas/Pdf.js'
import { requireAuth } from '../middlewares/auth.js'

const router = Router();

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { text, pdfId, difficulty = 'medium', types = ['MCQ'], topic, count = 10, reuseQuizId } = req.body || {};
    
    // Validate pdfId format if provided
    if (pdfId && typeof pdfId === 'string' && !/^[0-9a-fA-F]{24}$/.test(pdfId)) {
      return res.status(400).json({ 
        error: `Invalid PDF ID format: "${pdfId}". Expected a valid MongoDB ObjectId.` 
      });
    }
    
    // If reuseQuizId is provided, return existing quiz
    if (reuseQuizId) {
      const existingQuiz = await Quiz.findOne({
        _id: reuseQuizId,
        isActive: true
      }).populate('pdf', 'title filename');
      
      if (existingQuiz) {
        return res.json({
          quizId: existingQuiz._id,
          difficulty: existingQuiz.difficulty,
          types: existingQuiz.types,
          topic: existingQuiz.topic,
          questions: existingQuiz.questions,
          isReattempt: true
        });
      }
    }
    
    let contentText = text;
    
    // If pdfId is provided, fetch the PDF content
    if (pdfId && !contentText) {
      const pdf = await Pdf.findOne({ _id: pdfId, user: req.user._id });
      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found or access denied' });
      }
      
      // Use summary as content text (or chapters combined)
      // Note: extractedText is not stored, only summary and chapters
      if (pdf.summary) {
        contentText = pdf.summary;
      } else if (pdf.chapters && pdf.chapters.length > 0) {
        contentText = pdf.chapters.join('\n\n');
      } else {
        // If no content available, generate a basic quiz based on topic
        contentText = topic || pdf.title || 'General Knowledge';
      }
    }
    
    const quizData = await generateQuiz({ 
      text: contentText, 
      pdfId,
      difficulty, 
      types, 
      topic,
      count 
    });
    
    // Save the quiz to database for future reattempts
    if (pdfId) {
      const savedQuiz = await Quiz.create({
        pdf: pdfId,
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        types: quizData.types,
        questions: quizData.questions,
        totalQuestions: quizData.questions.length,
        createdBy: req.user._id
      });
      
      quizData.quizId = savedQuiz._id;
    }
    
    res.json(quizData);
  } catch (e) {
    console.error('Quiz generation error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { questions, responses, topic, difficulty, pdfId, quizId, isReattempt, originalAttemptId } = req.body || {}
    const result = await submitQuiz({ questions, responses });
    
    // Store attempt with full details
    const attemptData = {
      user: req.user._id,
      pdf: pdfId || null,
      topic,
      difficulty,
      score: result.score,
      correct: result.correct,
      total: result.total,
      questions,
      responses,
      results: result.results,
      isReattempt: isReattempt || false,
      originalAttemptId: originalAttemptId || null,
    };
    
    // Only include quiz reference if quizId is provided (PDF-based quizzes)
    if (quizId) {
      attemptData.quiz = quizId;
    }
    
    const attempt = await QuizAttempt.create(attemptData)
    
    res.json({ ...result, attemptId: attempt._id });
  } catch (e) {
    console.error('Quiz submission error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get a specific quiz attempt with full details
router.get('/attempts/:id', requireAuth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('pdf', 'title filename');
    
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    res.json({ attempt });
  } catch (e) {
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
      .populate('pdf', 'title filename')
      .populate('quiz');
    
    res.json({ attempts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a specific quiz by ID for reattempt
router.get('/quiz/:id', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('pdf', 'title filename');
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json({ quiz });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all quizzes for a PDF
router.get('/quizzes', requireAuth, async (req, res) => {
  try {
    const { pdfId } = req.query;
    const query = { isActive: true };
    if (pdfId) query.pdf = pdfId;
    
    const quizzes = await Quiz.find(query)
      .sort({ createdAt: -1 })
      .populate('pdf', 'title filename')
      .select('topic difficulty types totalQuestions createdAt');
    
    res.json({ quizzes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
