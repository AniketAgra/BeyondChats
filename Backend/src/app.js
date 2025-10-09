import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import compression from 'compression';
import fs from 'fs';

import pdfRouter from './routes/pdf.js';
import pdfUploadRouter from './routes/pdfRoutes.js';
import youtubeRouter from './routes/youtube.js';
import notesRouter from './routes/notes.js';
import quizRouter from './routes/quiz.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import analyticsRouter from './routes/analytics.js';
import keyFeaturesRouter from './routes/keyFeatures.js';
import aiBuddyRouter from './routes/aibuddy.js';

const app = express();

// Core middleware
// Configure allowed origin for CORS. In production set ORIGIN or FRONTEND_URL env var.
const ORIGIN = process.env.ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5174';
app.use(cors({ origin: ORIGIN, credentials: true }));
// Enable gzip compression for responses (helps static assets)
app.use(compression());

// Basic security headers (lightweight alternative to helmet here)
app.use((req, res, next) => {
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('X-Frame-Options', 'DENY');
	res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
	res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
	next();
});
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get("*name", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

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
app.use('/api/aibuddy', aiBuddyRouter);


export default app;
