import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/db/db.js';
import { setupSocketHandlers } from './src/sockets/chatSocket.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const ORIGIN = process.env.ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';

async function start() {
  await connectDB(MONGO_URI);
  
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: ORIGIN,
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
