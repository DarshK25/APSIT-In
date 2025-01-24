import express from "express";
import { createEvent, getAllEvents, updateEvent, deleteEvent } from "../controllers/eventController.js";
import protectRoute from "../middleware/auth.middleware.js";
import checkAccess from "../middleware/event.middleware.js";

const router = express.Router();

// Route: Get all events (open to all authenticated users)
router.get("/", protectRoute, getAllEvents);

// Route: Create an event (only admins)
router.post("/", protectRoute, checkAccess("admin"), createEvent);

// Route: Update an event (admins or event creator)
router.put("/:id", protectRoute, checkAccess("moderators"), updateEvent);

// Route: Delete an event (admins or event creator)
router.delete("/:id", protectRoute, checkAccess("admin"), deleteEvent);

export default router;
