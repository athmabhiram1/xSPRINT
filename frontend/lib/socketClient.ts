import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Lazy Socket.IO singleton
 * Connect only when needed, not globally
 */
export function getSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_URL, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('Socket.IO connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });
    }

    return socket;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
