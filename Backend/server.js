import dotenv from 'dotenv';
import app from './src/app.js';
import { connectDB } from './src/db/db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
}

start();
