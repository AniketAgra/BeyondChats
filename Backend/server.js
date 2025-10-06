import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import pdfRouter from './src/routes/pdf.js';
import pdfUploadRouter from './src/routes/pdfRoutes.js';
import youtubeRouter from './src/routes/youtube.js';
import notesRouter from './src/routes/notes.js';
import quizRouter from './src/routes/quiz.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.ORIGIN || '*'}));
app.use(express.json({ limit: '5mb' }));

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

// API routes
app.use('/api/pdf', pdfRouter);
app.use('/api/pdf', pdfUploadRouter); // /api/pdf/upload
app.use('/api/youtube', youtubeRouter);
app.use('/api/notes', notesRouter);
app.use('/api/quiz', quizRouter);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edulearn';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Mongo connected');
  } catch (err) {
    console.warn('Mongo connection failed, continuing without DB (mock mode):', err.message);
  }
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
}

start();
