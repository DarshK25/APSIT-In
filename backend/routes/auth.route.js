import express from "express";
import user from "../models/user.model.js";
import { signup, login, logout, getMe } from "../controllers/auth.controller.js"; // Import the getMe controller
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

 
// New route for fetching current user information
router.get("/me", protectRoute, getMe);

export default router;
