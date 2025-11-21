"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketIo = void 0;
const app_1 = require("./app");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./lib/db"));
const PORT = process.env.PORT || 5000;
const httpServer = http_1.default.createServer(app_1.app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Allow all for hackathon/dev
        methods: ["GET", "POST"]
    }
});
// Realtime Event Handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join_match_room', (matchId) => {
        socket.join(`match_${matchId}`);
    });
    socket.on('leave_match_room', (matchId) => {
        socket.leave(`match_${matchId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
// Global access to IO for controllers
exports.socketIo = io;
httpServer.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    try {
        yield db_1.default.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed', error);
    }
}));
