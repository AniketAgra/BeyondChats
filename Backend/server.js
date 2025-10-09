import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/db/db.js';
import { setupSocketHandlers } from './src/sockets/chatSocket.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const ORIGIN = process.env.ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5174';

// Support providing multiple origins as comma-separated list for local/dev convenience
const allowedOrigins = Array.isArray(ORIGIN) ? ORIGIN : ORIGIN.split(',').map(s => s.trim())

async function start() {
  await connectDB(MONGO_URI);
  
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl)
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        const msg = `CORS error: origin ${origin} not allowed`
        return callback(new Error(msg), false)
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });
  
  setupSocketHandlers(io);
  
  httpServer.listen(PORT, () => {
    console.log(`API on http://localhost:${PORT}`);
    console.log(`Socket.IO ready for real-time chat`);
  });
}

start();
