import Post from "../models/post.model.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js" 
import fs from 'fs/promises';
import Comment from "../models/comment.model.js";

export const getFeedPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            $or: [
                { author: { $in: req.user.connections } }, // Posts from connections
                { author: req.user._id },                 // Posts by the current user
            ],
        })
        .populate("author", "name username profilePicture headline")
        .populate({
            path: "comments",
            populate: [
                {
                    path: "author",
                    select: "name username profilePicture"
                },
                {
                    path: "replies",
                    populate: {
                        path: "author",
                        select: "name username profilePicture"
                    }
                }
            ]
        })
        .sort({ createdAt: -1 });

        // Transform posts to include liked status
        const transformedPosts = posts.map(post => ({
            ...post.toObject(),
            likes: post.likes.length,
            liked: post.likes.includes(req.user._id),
            comments: post.comments.map(comment => ({
                ...comment,
                likes: comment.likes.length,
                liked: comment.likes.includes(req.user._id),
                replies: comment.replies?.map(reply => ({
                    ...reply,
                    likes: reply.likes.length,
                    liked: reply.likes.includes(req.user._id)
                }))
            }))
        }));

        res.status(200).json({ success: true, newPost: transformedPosts });
    } catch (error) {
        console.error("Error in getFeedPosts: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content && !req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "Post must contain either text content or an image" 
            });
        }

        const post = new Post({
            author: req.user._id,
            content: content || "",
            likes: [],
            comments: []
        });

        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path);
                post.image = result.secure_url;
                // Delete the local file after upload
                await fs.unlink(req.file.path);
            } catch (uploadError) {
                console.error("Error uploading to Cloudinary:", uploadError);
                return res.status(500).json({ 
                    success: false, 
                    message: "Error uploading image" 
                });
            }
        }

        await post.save();

        // Populate the post with author details
        const populatedPost = await Post.findById(post._id)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "name username profilePicture"
                }
            });

        const transformedPost = {
            ...populatedPost.toObject(),
            likes: 0,
            liked: false
        };

        res.status(201).json({ success: true, post: transformedPost });
    } catch (error) {
        console.error("Error in createPost: ", error);
        // If there's a file and an error occurs, clean up the uploaded file
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error("Error deleting uploaded file:", unlinkError);
            }
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getPostById = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id)
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name username profilePicture headline");
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }
        res.status(200).json({success: true, post});
    } catch(error) {
        console.error("Error in getPost: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export const updatePost = async (req, res) => {
    try {
        // First find the post and check authorization
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this post" });
        }

        // Update content if provided
        if (req.body.content !== undefined) {
            post.content = req.body.content.trim();
        }

        // Handle image update if file is provided
        if (req.file) {
            try {
                if (post.image) {
                    // Delete old image
                    const publicId = post.image.split("/").pop().split(".")[0];
                    await cloudinary.uploader.destroy(publicId);
                }
                // Upload new image
                const result = await cloudinary.uploader.upload(req.file.path);
                post.image = result.secure_url;
                // Clean up uploaded file
                await fs.unlink(req.file.path);
            } catch (error) {
                console.error("Error handling image:", error);
                return res.status(500).json({ success: false, message: "Error updating image" });
            }
        }

        // Handle image removal
        if (req.body.removeImage === 'true' && post.image) {
            try {
                const publicId = post.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
                post.image = null;
            } catch (error) {
                console.error("Error removing image:", error);
            }
        }

        // Save the updated post
        await post.save();

        // Fetch fresh post with populated fields
        const updatedPost = await Post.findById(post._id)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture"
                        }
                    }
                ]
            });

        // Transform the post for response
        const transformedPost = {
            ...updatedPost.toObject(),
            likes: updatedPost.likes.length,
            liked: updatedPost.likes.includes(req.user._id),
            comments: updatedPost.comments.map(comment => ({
                ...comment,
                likes: comment.likes.length,
                liked: comment.likes.includes(req.user._id),
                replies: comment.replies?.map(reply => ({
                    ...reply,
                    likes: reply.likes.length,
                    liked: reply.likes.includes(req.user._id)
                }))
            }))
        };

        // Send success response
        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            post: transformedPost
        });

    } catch (error) {
        console.error("Error in updatePost:", error);
        // Clean up uploaded file if exists
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error("Error deleting uploaded file:", unlinkError);
            }
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this post" });
        }

        // Delete image from cloudinary if exists
        if (post.image) {
            try {
                const publicId = post.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.error("Error deleting image from Cloudinary:", cloudinaryError);
                // Continue with post deletion even if image deletion fails
            }
        }

        // Delete all comments associated with the post
        await Comment.deleteMany({ post: post._id });

        // Delete the post
        await Post.findByIdAndDelete(post._id);

        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
            deletedPostId: post._id
        });
    } catch (error) {
        console.error("Error in deletePost: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "name username profilePicture headline");
            
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const isLiked = post.likes.includes(req.user._id);
        
        if (isLiked) {
            // Unlike the post
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            // Like the post
            post.likes.push(req.user._id);

            // Create notification for post like if the author is not the current user
            if (post.author._id.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: post.author._id,
                    type: "like",
                    relatedUser: req.user._id,
                    relatedPost: post._id
                });
            }
        }

        await post.save();

        // Return the updated post with transformed like data
        const transformedPost = {
            ...post.toObject(),
            likes: post.likes.length,
            liked: !isLiked
        };

        res.status(200).json({ 
            success: true,
            post: transformedPost
        });
    } catch (error) {
        console.error("Error in likePost: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: "Comment content is required" });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const comment = {
            content,
            author: req.user._id,
            likes: [],
            replies: []
        };

        post.comments.push(comment);
        await post.save();

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(post._id)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture"
                        }
                    }
                ]
            });

        // Create notification for comment if the author is not the current user
        if (post.author.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: post.author,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: post._id
            });
        }

        const transformedPost = {
            ...updatedPost.toObject(),
            likes: updatedPost.likes.length,
            liked: updatedPost.likes.includes(req.user._id),
            comments: updatedPost.comments.map(comment => ({
                ...comment,
                likes: comment.likes.length,
                liked: comment.likes.includes(req.user._id),
                replies: comment.replies?.map(reply => ({
                    ...reply,
                    likes: reply.likes.length,
                    liked: reply.likes.includes(req.user._id)
                }))
            }))
        };

        res.status(200).json({ success: true, post: transformedPost });
    } catch (error) {
        console.error("Error in addComment: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const likeComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const isLiked = comment.likes.includes(req.user._id);
        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            comment.likes.push(req.user._id);
        }

        await post.save();

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(post._id)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture"
                        }
                    }
                ]
            });

        const transformedPost = {
            ...updatedPost.toObject(),
            likes: updatedPost.likes.length,
            liked: updatedPost.likes.includes(req.user._id),
            comments: updatedPost.comments.map(comment => ({
                ...comment,
                likes: comment.likes.length,
                liked: comment.likes.includes(req.user._id),
                replies: comment.replies?.map(reply => ({
                    ...reply,
                    likes: reply.likes.length,
                    liked: reply.likes.includes(req.user._id)
                }))
            }))
        };

        res.status(200).json({ success: true, post: transformedPost });
    } catch (error) {
        console.error("Error in likeComment: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const replyToComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: "Reply content is required" });
        }

        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const reply = {
            content,
            author: req.user._id,
            likes: [],
            createdAt: new Date()
        };

        if (!comment.replies) {
            comment.replies = [];
        }
        comment.replies.push(reply);
        await post.save();

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(post._id)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "name username profilePicture"
                }
            });

        const transformedPost = {
            ...updatedPost.toObject(),
            likes: updatedPost.likes.length,
            liked: updatedPost.likes.includes(req.user._id)
        };

        res.status(200).json({ success: true, post: transformedPost });
    } catch (error) {
        console.error("Error in replyToComment: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

