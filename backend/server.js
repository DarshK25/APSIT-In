import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js"; 
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import messageRoutes from "./routes/message.route.js";
import eventRoutes from "./routes/event.route.js";
import { connectDB } from "./lib/db.js";
import { initSocket } from './socket/socket.js';
import { createServer } from "http";
import { createUploadsDir } from './utils/createUploadsDir.js';

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

app.use(cookieParser());

app.use(express.json()); //middleware to parse req.body which is JSON data

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use("/api/v1/auth", authRoutes);// Auth routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/events", eventRoutes);

const httpServer = createServer(app);
const io = initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});