import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {getFeedPosts, createPost, getPostById, updatePost, deletePost, likePost} from "../controllers/post.controller.js";
import {createComment, updateComment, deleteComment, likeComment, replyToComment} from "../controllers/comment.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Protect all routes
router.use(protectRoute);

// Post CRUD routes
router.route("/")
    .get(getFeedPosts)
    .post(upload.single('image'), createPost);

router.route("/:id")
    .get(getPostById)
    .put(upload.single('image'), updatePost)
    .delete(deletePost);

// Post interaction routes
router.route("/:id/like")
    .post(likePost)
    .delete(likePost);

// Comment routes
router.route("/:postId/comments")
    .post(createComment);

router.route("/:postId/comments/:commentId")
    .put(updateComment)
    .delete(deleteComment);

// Comment interaction routes
router.route("/:postId/comments/:commentId/like")
    .post(likeComment);

router.route("/:postId/comments/:commentId/replies")
    .post(replyToComment);

export default router;