import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js"; 
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import messageRoutes from "./routes/message.route.js";
import eventRoutes from "./routes/event.route.js";
import { connectDB } from "./lib/db.js";
import { initSocket } from './socket/socket.js';
import { createServer } from "http";
import { createUploadsDir } from './utils/createUploadsDir.js';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
createUploadsDir();

// Enable CORS for all routes
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'], // frontend URLs
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use(cors(corsOptions));  // Move this before routes

// Body parser middleware
app.use(express.json({ limit: '50mb' })); // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/comments", commentRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const httpServer = createServer(app);
const io = initSocket(httpServer);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Don't crash the server, just log the error
    // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't crash the server, just log the error
    // process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    httpServer.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
});

const startServer = async () => {
    try {
        await connectDB(); // Connect to database first
        console.log('Connected to MongoDB');
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();