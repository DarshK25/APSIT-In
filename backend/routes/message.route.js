import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    getConversations, 
    getMessages, 
    sendMessage,
    muteChat,
    reportUser,
    blockUser,
    deleteChat,
    markMessagesAsRead
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:userId", protectRoute, getMessages);
router.post("/send", protectRoute, sendMessage);

// Chat options routes
router.post("/mute/:userId", protectRoute, muteChat);
router.post("/report/:userId", protectRoute, reportUser);
router.post("/block/:userId", protectRoute, blockUser);
router.delete("/chat/:userId", protectRoute, deleteChat);
router.post("/:userId/read", protectRoute, markMessagesAsRead);

export default router;