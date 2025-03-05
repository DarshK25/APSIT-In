import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Your frontend URL
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room based on userId
    socket.on('setup', (userId) => {
      socket.join(userId);
      socket.emit('connected');
    });

    // Join chat room
    socket.on('join chat', (room) => {
      socket.join(room);
      console.log('User joined room:', room);
    });

    // Handle new message
    socket.on('new message', (newMessageReceived) => {
      let chat = newMessageReceived.chat;

      if (!chat.users) return console.log('Chat.users not defined');

      chat.users.forEach((user) => {
        if (user._id === newMessageReceived.sender._id) return;

        socket.in(user._id).emit('message received', newMessageReceived);
      });
    });

    // Handle typing status
    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}; 