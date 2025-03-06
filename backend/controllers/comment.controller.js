import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const createComment = async (req, res) => {
    try {
        const { content, postId } = req.body;
        const userId = req.user._id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required and cannot be empty"
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const comment = await Comment.create({
            author: userId,
            post: postId,
            content: content.trim()
        });

        // Add comment to post
        post.comments.push(comment._id);
        await post.save();

        // Create notification for post owner
        if (post.author.toString() !== userId.toString()) {
            const user = await User.findById(userId).select("name");
            await Notification.create({
                recipient: post.author,
                sender: userId,
                type: "comment",
                message: `${user.name} commented on your post`,
                post: postId
            });
        }

        // Populate comment with author details
        const populatedComment = await Comment.findById(comment._id)
            .populate("author", "name username profilePicture");

        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            comment: populatedComment
        });
    } catch (error) {
        console.error("Error in createComment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (comment.author.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this comment" });
        }

        comment.content = content.trim();
        await comment.save();

        const updatedComment = await Comment.findById(commentId)
            .populate("author", "name username profilePicture");

        res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            comment: updatedComment
        });
    } catch (error) {
        console.error("Error in updateComment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId).populate('post');
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const { post } = comment;
        const isAuthorized = 
            comment.author.toString() === userId.toString() || 
            post.author.toString() === userId.toString();

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this comment" });
        }

        // Remove comment from post
        await Post.findByIdAndUpdate(post._id, {
            $pull: { comments: commentId }
        });

        // Delete comment and all its replies
        await Comment.deleteMany({
            $or: [
                { _id: commentId },
                { parentComment: commentId }
            ]
        });

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteComment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const isLiked = comment.likes.includes(userId);
        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        const updatedComment = await Comment.findById(commentId)
            .populate("author", "name username profilePicture");

        res.status(200).json({
            success: true,
            message: `Comment ${isLiked ? 'unliked' : 'liked'} successfully`,
            comment: updatedComment
        });
    } catch (error) {
        console.error("Error in likeComment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getCommentReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const replies = await Comment.find({ parentComment: commentId })
            .populate("author", "name username profilePicture")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            replies
        });
    } catch (error) {
        console.error("Error in getCommentReplies:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createReply = async (req, res) => {
    try {
        const { content } = req.body;
        const { commentId } = req.params;
        const userId = req.user._id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Reply content is required and cannot be empty"
            });
        }

        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ success: false, message: "Parent comment not found" });
        }

        const reply = await Comment.create({
            author: userId,
            post: parentComment.post,
            content: content.trim(),
            parentComment: commentId
        });

        // Update parent comment's reply count
        parentComment.replyCount += 1;
        await parentComment.save();

        // Create notification for comment author
        if (parentComment.author.toString() !== userId.toString()) {
            const user = await User.findById(userId).select("name");
            await Notification.create({
                recipient: parentComment.author,
                sender: userId,
                type: "reply",
                message: `${user.name} replied to your comment`,
                post: parentComment.post
            });
        }

        const populatedReply = await Comment.findById(reply._id)
            .populate("author", "name username profilePicture");

        res.status(201).json({
            success: true,
            message: "Reply created successfully",
            reply: populatedReply
        });
    } catch (error) {
        console.error("Error in createReply:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};