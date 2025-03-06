import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {getFeedPosts, createPost, getPostById, updatePost, deletePost, likePost, addComment, cleanupOrphanedComments} from "../controllers/post.controller.js";
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
router.post("/:id/like", likePost);

// Comment routes
router.route("/:id/comments")
    .post(addComment);

// Maintenance routes
router.post("/maintenance/cleanup-comments", async (req, res) => {
    try {
        await cleanupOrphanedComments();
        res.status(200).json({ success: true, message: "Comments cleanup completed" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error cleaning up comments" });
    }
});

export default router;