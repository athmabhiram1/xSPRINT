import { Server } from 'socket.io';

let io: Server;

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all for now
            methods: ["GET", "POST"]
        }
    });
    return io;
};

export const getSocket = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
