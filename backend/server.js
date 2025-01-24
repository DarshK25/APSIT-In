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
import initSocket from "./lib/socket.js";
import { createServer } from "http";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
const corsOptions = {
  origin: 'http://localhost:5173', // frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers)
};
app.use(cors(corsOptions));  // Move this before routes

app.use(cookieParser());

app.use(express.json()); //middleware to parse req.body which is JSON data

app.use("/api/v1/auth", authRoutes);// Auth routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/events", eventRoutes);

const server = createServer(app);
const io = initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});