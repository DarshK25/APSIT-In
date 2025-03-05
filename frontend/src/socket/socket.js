import { io } from 'socket.io-client';

let socket;

export const initSocket = (user) => {
  if (!user) return;

  if (socket) {
    socket.disconnect();
  }

  socket = io('http://localhost:3000', {
    withCredentials: true
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('setup', user._id);
  });

  socket.on('connected', () => {
    console.log('Socket setup completed');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 