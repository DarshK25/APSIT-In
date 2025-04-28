import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import checkAccess from "../middleware/event.middleware.js";
import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent,
    getMyEvents,
    getOrganizedEvents
} from "../controllers/event.controller.js";

const router = express.Router();

// Public routes
router.get("/", getEvents);

// Protected routes
router.use(protectRoute);

// Create event route (must come before :id routes)
router.post("/create", upload.single("image"), checkAccess("moderators"), createEvent);

// Routes with :id parameter
router.get("/:id", getEvent);
router.put("/:id", upload.single("image"), checkAccess("moderators"), updateEvent);
router.delete("/:id", checkAccess("moderators"), deleteEvent);
router.post("/:id/register", registerForEvent);
router.post("/:id/unregister", unregisterFromEvent);

// User-specific routes
router.get("/user/registered", getMyEvents);
router.get("/user/organized", getOrganizedEvents);

export default router;
