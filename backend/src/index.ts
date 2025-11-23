import { app } from './app';
import dotenv from 'dotenv';
import http from 'http';
import { initSocket } from './lib/socket';


dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Xthlete Engine running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.IO initialized`);
});

