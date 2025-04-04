import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    addComment,
    updateComment,
    deleteComment,
    likeComment,
    createReply,
    deleteReply,
    likeReply
} from "../controllers/comment.controller.js";

const router = express.Router();

// Protect all routes
router.use(protectRoute);

// Comment routes
router.post('/posts/:postId/comments', addComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', likeComment);

// Reply routes
router.post('/:commentId/replies', createReply);
router.delete('/replies/:id', deleteReply);
router.post('/replies/:id/like', likeReply);

export default router; 