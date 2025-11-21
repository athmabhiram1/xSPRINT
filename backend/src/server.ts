import { app } from './app';
import http from 'http';
import { Server } from 'socket.io';
import prisma from './lib/db';

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all for hackathon/dev
    methods: ["GET", "POST"]
  }
});

// Realtime Event Handling
io.on('connection', (socket: any) => {
  console.log('New client connected:', socket.id);

  socket.on('join_match_room', (matchId: any) => {
    socket.join(`match_${matchId}`);
  });

  socket.on('leave_match_room', (matchId: any) => {
    socket.leave(`match_${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Global access to IO for controllers
export const socketIo = io;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed', error);
  }
});