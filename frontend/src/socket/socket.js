import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
            transports: ['websocket'],
            autoConnect: true
        });

        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}; 