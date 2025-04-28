import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	deleteNotification,
	getUserNotifications,
	markNotificationAsRead,
	markAllAsRead,
	deleteAllNotifications,
	createNotification,
	markAsRead,
	getUnreadCount
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUserNotifications);

router.patch("/:id/read", protectRoute, markNotificationAsRead);
router.patch("/mark-all-read", protectRoute, markAllAsRead);

router.delete("/:id", protectRoute, deleteNotification);
router.delete("/clear-all", protectRoute, deleteAllNotifications);

// New endpoints for club membership notifications
router.post("/create", protectRoute, createNotification);
router.put("/:notificationId/mark-read", protectRoute, markAsRead);
router.get("/unread-count", protectRoute, getUnreadCount);

export default router;
