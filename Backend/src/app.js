import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import pdfRouter from './routes/pdf.js';
import pdfUploadRouter from './routes/pdfRoutes.js';
import youtubeRouter from './routes/youtube.js';
import notesRouter from './routes/notes.js';
import quizRouter from './routes/quiz.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import analyticsRouter from './routes/analytics.js';
import debugRouter from './routes/debug.js';
import keyFeaturesRouter from './routes/keyFeatures.js';

const app = express();

// Core middleware
const ORIGIN = process.env.ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

// API routes
app.use('/api/pdf', pdfRouter);
app.use('/api/pdf', pdfUploadRouter); // /api/pdf/upload (auth enforced in router)
app.use('/api/youtube', youtubeRouter);
app.use('/api/notes', notesRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/key-features', keyFeaturesRouter);
if (String(process.env.ENABLE_DEBUG_ROUTES).toLowerCase() === 'true') {
	app.use('/api/debug', debugRouter);
}

export default app;
