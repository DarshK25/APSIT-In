import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {getFeedPosts, createPost, getPostById, updatePost, deletePost, likePost} from "../controllers/post.controller.js";
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

export default router;