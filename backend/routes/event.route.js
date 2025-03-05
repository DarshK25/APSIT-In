import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
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
router.get("/:id", getEvent);

// Protected routes
router.use(protectRoute);

router.post("/", upload.single("image"), createEvent);
router.put("/:id", upload.single("image"), updateEvent);
router.delete("/:id", deleteEvent);

router.post("/:id/register", registerForEvent);
router.post("/:id/unregister", unregisterFromEvent);

router.get("/user/registered", getMyEvents);
router.get("/user/organized", getOrganizedEvents);

export default router;
