import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {getFeedPosts, createPost, getPostById, updatePost, deletePost, likePost} from "../controllers/post.controller.js";
import {createComment, updateComment, deleteComment, likeComment, replyToComment} from "../controllers/comment.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/", protectRoute, createPost);
router.get("/:id", protectRoute, getPostById);
router.put("/update/:id", protectRoute, updatePost);
router.delete("/delete/:id", protectRoute, deletePost);
router.post("/:id/like", protectRoute, likePost);
// Comment routes
router.post("/:postId/comments", protectRoute, createComment);
router.put("/:postId/comments/:commentId", protectRoute, updateComment);
router.delete("/:postId/comments/:commentId", protectRoute, deleteComment);
router.post("/:postId/comments/:commentId/like", protectRoute, likeComment);
router.post("/:postId/comments/:commentId/reply", protectRoute, replyToComment)

export default router;