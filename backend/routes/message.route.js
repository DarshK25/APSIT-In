import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getConversations, getMessages, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:userId", protectRoute, getMessages);
router.post("/send", protectRoute, sendMessage);

export default router;