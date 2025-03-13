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
        const postId = req.params.id || req.params.postId;
        const userId = req.user._id;

        console.log("Liking comment:", commentId, "on post:", postId, "User:", userId);

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
        console.log("Comment like status updated");

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture headline",
                        model: "User"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture headline",
                            model: "User"
                        }
                    }
                ]
            });

        if (!updatedPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        console.log("Fetched updated post with comments:", updatedPost.comments.length);

        // Transform the post for response
        const postObj = updatedPost.toObject();
        const comments = Array.isArray(postObj.comments) ? postObj.comments : [];
        
        console.log("Processing comments for response, count:", comments.length);
        
        const transformedPost = {
            ...postObj,
            likes: Array.isArray(updatedPost.likes) ? updatedPost.likes.length : 0,
            liked: Array.isArray(updatedPost.likes) ? updatedPost.likes.includes(userId) : false,
            comments: comments.map(comment => {
                // Skip comments with invalid/deleted authors
                if (!comment || !comment.author) {
                    console.log("Skipping comment with missing author:", comment?._id);
                    return null;
                }
                
                // Ensure replies is an array
                const replies = Array.isArray(comment.replies) ? comment.replies : [];
                
                console.log(`Comment ${comment._id} has ${replies.length} replies`);
                
                return {
                    ...comment,
                    likes: Array.isArray(comment.likes) ? comment.likes.length : 0,
                    liked: Array.isArray(comment.likes) ? comment.likes.includes(userId) : false,
                    replies: replies.map(reply => {
                        if (!reply || !reply.author) {
                            console.log("Skipping reply with missing author:", reply?._id);
                            return null;
                        }
                        
                        return {
                            ...reply,
                            likes: Array.isArray(reply.likes) ? reply.likes.length : 0,
                            liked: Array.isArray(reply.likes) ? reply.likes.includes(userId) : false
                        };
                    }).filter(Boolean)
                };
            }).filter(Boolean) // Remove null comments
        };

        console.log("Transformed post has comments:", transformedPost.comments.length);

        res.status(200).json({
            success: true,
            message: `Comment ${isLiked ? 'unliked' : 'liked'} successfully`,
            post: transformedPost
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
        const postId = req.params.id || req.params.postId;
        const userId = req.user._id;

        console.log("Creating reply to comment:", commentId, "on post:", postId, "Content:", content, "User:", userId);

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

        console.log("Reply created:", reply._id);

        // Update parent comment's reply count
        parentComment.replyCount += 1;
        await parentComment.save();
        console.log("Updated parent comment replyCount");

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
            console.log("Created notification for comment author");
        }

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(postId || parentComment.post)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture headline",
                        model: "User"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture headline",
                            model: "User"
                        }
                    }
                ]
            });

        if (!updatedPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        console.log("Fetched updated post with comments:", updatedPost.comments.length);

        // Transform the post for response
        const postObj = updatedPost.toObject();
        const comments = Array.isArray(postObj.comments) ? postObj.comments : [];
        
        console.log("Processing comments for response, count:", comments.length);
        
        const transformedPost = {
            ...postObj,
            likes: Array.isArray(updatedPost.likes) ? updatedPost.likes.length : 0,
            liked: Array.isArray(updatedPost.likes) ? updatedPost.likes.includes(userId) : false,
            comments: comments.map(comment => {
                // Skip comments with invalid/deleted authors
                if (!comment || !comment.author) {
                    console.log("Skipping comment with missing author:", comment?._id);
                    return null;
                }
                
                // Ensure replies is an array
                const replies = Array.isArray(comment.replies) ? comment.replies : [];
                
                console.log(`Comment ${comment._id} has ${replies.length} replies`);
                
                return {
                    ...comment,
                    likes: Array.isArray(comment.likes) ? comment.likes.length : 0,
                    liked: Array.isArray(comment.likes) ? comment.likes.includes(userId) : false,
                    replies: replies.map(reply => {
                        if (!reply || !reply.author) {
                            console.log("Skipping reply with missing author:", reply?._id);
                            return null;
                        }
                        
                        return {
                            ...reply,
                            likes: Array.isArray(reply.likes) ? reply.likes.length : 0,
                            liked: Array.isArray(reply.likes) ? reply.likes.includes(userId) : false
                        };
                    }).filter(Boolean)
                };
            }).filter(Boolean) // Remove null comments
        };

        console.log("Transformed post has comments:", transformedPost.comments.length);

        res.status(201).json({
            success: true,
            message: "Reply created successfully",
            post: transformedPost
        });
    } catch (error) {
        console.error("Error in createReply:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteReply = async (req, res) => {
    try {
        const { commentId, replyId } = req.params;
        const postId = req.params.id || req.params.postId;
        const userId = req.user._id;

        console.log("Deleting reply:", replyId, "from comment:", commentId, "on post:", postId);

        // Find the reply
        const reply = await Comment.findById(replyId);
        if (!reply) {
            return res.status(404).json({ success: false, message: "Reply not found" });
        }

        // Check if user is authorized (reply author or post author)
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const isAuthorized = 
            reply.author.toString() === userId.toString() || 
            post.author.toString() === userId.toString();

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this reply" });
        }

        // Find parent comment to update reply count
        const parentComment = await Comment.findById(commentId);
        if (parentComment && parentComment.replyCount > 0) {
            parentComment.replyCount -= 1;
            await parentComment.save();
        }

        // Delete the reply
        await Comment.findByIdAndDelete(replyId);

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture headline",
                        model: "User"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture headline",
                            model: "User"
                        }
                    }
                ]
            });

        if (!updatedPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        // Transform the post for response
        const postObj = updatedPost.toObject();
        const comments = Array.isArray(postObj.comments) ? postObj.comments : [];
        
        const transformedPost = {
            ...postObj,
            likes: Array.isArray(updatedPost.likes) ? updatedPost.likes.length : 0,
            liked: Array.isArray(updatedPost.likes) ? updatedPost.likes.includes(userId) : false,
            comments: comments.map(comment => {
                // Skip comments with invalid/deleted authors
                if (!comment || !comment.author) {
                    return null;
                }
                
                // Ensure replies is an array
                const replies = Array.isArray(comment.replies) ? comment.replies : [];
                
                return {
                    ...comment,
                    likes: Array.isArray(comment.likes) ? comment.likes.length : 0,
                    liked: Array.isArray(comment.likes) ? comment.likes.includes(userId) : false,
                    replies: replies.map(reply => {
                        if (!reply || !reply.author) {
                            return null;
                        }
                        
                        return {
                            ...reply,
                            likes: Array.isArray(reply.likes) ? reply.likes.length : 0,
                            liked: Array.isArray(reply.likes) ? reply.likes.includes(userId) : false
                        };
                    }).filter(Boolean)
                };
            }).filter(Boolean) // Remove null comments
        };

        res.status(200).json({
            success: true,
            message: "Reply deleted successfully",
            post: transformedPost
        });
    } catch (error) {
        console.error("Error in deleteReply:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const likeReply = async (req, res) => {
    try {
        const { commentId, replyId } = req.params;
        const postId = req.params.id || req.params.postId;
        const userId = req.user._id;

        console.log("Liking reply:", replyId, "on comment:", commentId, "post:", postId, "User:", userId);

        const reply = await Comment.findById(replyId);
        if (!reply) {
            return res.status(404).json({ success: false, message: "Reply not found" });
        }

        // Check if this is actually a reply
        if (!reply.parentComment) {
            return res.status(400).json({ success: false, message: "This is not a reply" });
        }

        const isLiked = reply.likes.includes(userId);
        if (isLiked) {
            reply.likes = reply.likes.filter(id => id.toString() !== userId.toString());
        } else {
            reply.likes.push(userId);
        }

        await reply.save();
        console.log("Reply like status updated");

        // Fetch the updated post with populated fields
        const updatedPost = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: [
                    {
                        path: "author",
                        select: "name username profilePicture headline",
                        model: "User"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "author",
                            select: "name username profilePicture headline",
                            model: "User"
                        }
                    }
                ]
            });

        if (!updatedPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        console.log("Fetched updated post with comments:", updatedPost.comments.length);

        // Transform the post for response
        const postObj = updatedPost.toObject();
        const comments = Array.isArray(postObj.comments) ? postObj.comments : [];
        
        console.log("Processing comments for response, count:", comments.length);
        
        const transformedPost = {
            ...postObj,
            likes: Array.isArray(updatedPost.likes) ? updatedPost.likes.length : 0,
            liked: Array.isArray(updatedPost.likes) ? updatedPost.likes.includes(userId) : false,
            comments: comments.map(comment => {
                // Skip comments with invalid/deleted authors
                if (!comment || !comment.author) {
                    console.log("Skipping comment with missing author:", comment?._id);
                    return null;
                }
                
                // Ensure replies is an array
                const replies = Array.isArray(comment.replies) ? comment.replies : [];
                
                console.log(`Comment ${comment._id} has ${replies.length} replies`);
                
                return {
                    ...comment,
                    likes: Array.isArray(comment.likes) ? comment.likes.length : 0,
                    liked: Array.isArray(comment.likes) ? comment.likes.includes(userId) : false,
                    replies: replies.map(reply => {
                        if (!reply || !reply.author) {
                            console.log("Skipping reply with missing author:", reply?._id);
                            return null;
                        }
                        
                        return {
                            ...reply,
                            likes: Array.isArray(reply.likes) ? reply.likes.length : 0,
                            liked: Array.isArray(reply.likes) ? reply.likes.includes(userId) : false
                        };
                    }).filter(Boolean)
                };
            }).filter(Boolean) // Remove null comments
        };

        console.log("Transformed post has comments:", transformedPost.comments.length);

        res.status(200).json({
            success: true,
            message: "Reply like status updated",
            post: transformedPost
        });
    } catch (error) {
        console.error("Error in likeReply:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};