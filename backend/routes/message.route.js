import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import multer from "multer";
import { 
    getConversations, 
    getMessages, 
    sendMessage,
    sendFile,
    muteChat,
    reportUser,
    blockUser,
    deleteChat,
    markMessagesAsRead,
    sendMessageRequest,
    getMessageRequestStatus,
    acceptMessageRequest,
    rejectMessageRequest
} from "../controllers/message.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

router.get("/conversations", protectRoute, getConversations);
router.get("/:userId", protectRoute, getMessages);
router.post("/send", protectRoute, sendMessage);
router.post("/send-file", protectRoute, upload.single('file'), sendFile);

// Chat options routes
router.post("/mute/:userId", protectRoute, muteChat);
router.post("/report/:userId", protectRoute, reportUser);
router.post("/block/:userId", protectRoute, blockUser);
router.delete("/chat/:userId", protectRoute, deleteChat);
router.post("/:userId/read", protectRoute, markMessagesAsRead);

router.post("/request", protectRoute, upload.single('file'), sendMessageRequest);
router.get("/request-status/:userId", protectRoute, getMessageRequestStatus);
router.put("/request/accept/:requestId", protectRoute, acceptMessageRequest);
router.put("/request/reject/:requestId", protectRoute, rejectMessageRequest);

export default router;