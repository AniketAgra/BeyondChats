import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import pdfRouter from './routes/pdf.js';
import pdfUploadRouter from './routes/pdfRoutes.js';
import youtubeRouter from './routes/youtube.js';
import notesRouter from './routes/notes.js';
import quizRouter from './routes/quiz.js';
import authRouter from './routes/auth.js';

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
app.use('/api/pdf', pdfUploadRouter); // /api/pdf/upload
app.use('/api/youtube', youtubeRouter);
app.use('/api/notes', notesRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/auth', authRouter);

export default app;
