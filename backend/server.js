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
import clubRoutes from "./routes/club.route.js";
import settingsRoutes from "./routes/settings.route.js";
import { connectDB } from "./lib/db.js";
import { initSocket } from './socket/socket.js';
import { createServer } from "http";
import { createUploadsDir } from './utils/createUploadsDir.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
createUploadsDir();

// Enable CORS for all routes
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://apsit-in.vercel.app'   // Only allow production URL
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Cookie test endpoint for debugging
app.get('/api/v1/test-cookie', (req, res) => {
  console.log('🍪 Test endpoint - Received cookies:', req.cookies);
  console.log('📝 Headers:', req.headers);
  
  // Set a test cookie
  res.cookie('test-cookie', 'test-value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60000 // 1 minute
  });
  
  res.json({
    message: 'Test cookie set',
    receivedCookies: req.cookies,
    environment: process.env.NODE_ENV
  });
});

app.post('/api/v1/test-cookie', (req, res) => {
  console.log('🍪 POST Test endpoint - Received cookies:', req.cookies);
  console.log('📝 Headers:', req.headers);
  
  // Set a test cookie with production settings
  res.cookie('test-cookie-post', 'test-value-post', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60000 // 1 minute
  });
  
  res.json({
    message: 'POST Test cookie set',
    receivedCookies: req.cookies,
    environment: process.env.NODE_ENV,
    corsOrigin: process.env.NODE_ENV === 'production' ? 'https://apsit-in.vercel.app' : 'development'
  });
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the API'
    });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/clubs", clubRoutes);
app.use("/api/v1/settings", settingsRoutes);

// Serve uploaded files statically in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

// Serve frontend build files in production
// if (process.env.NODE_ENV === 'production') {
//   const frontendPath = path.join(__dirname, '../frontend/dist');
//   app.use(express.static(frontendPath));
  
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(frontendPath, 'index.html'));
//   });
// }

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