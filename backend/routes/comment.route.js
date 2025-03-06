import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    getCommentReplies,
    createReply
} from "../controllers/comment.controller.js";

const router = express.Router();

// Protect all routes
router.use(protectRoute);

// Comment CRUD routes
router.route("/")
    .post(createComment);

router.route("/:commentId")
    .put(updateComment)
    .delete(deleteComment);

// Comment interaction routes
router.route("/:commentId/like")
    .post(likeComment);

// Reply routes
router.route("/:commentId/replies")
    .get(getCommentReplies)
    .post(createReply);

export default router; 