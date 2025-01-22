import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {getFeedPosts, createPost, getPostById, updatePost, deletePost} from "../controllers/post.controller.js";
import {createComment} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/", protectRoute, createPost);
router.get("/:id", protectRoute, getPostById);
router.put("/update/:id", protectRoute, updatePost);
router.delete("/delete/:id", protectRoute, deletePost);
router.post("/comment/:id", protectRoute, createComment);

export default router;