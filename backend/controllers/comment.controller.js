import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import { handleError } from '../utils/errorHandler.js';
import Notification from '../models/notification.model.js';

export const getCommentsByPostId = async (req, res) => {
    try{
        const postId = req.params.postId;
        const comments = await Comment.find({ post: postId }).populate('author');
        res.json(comments);
    } catch (error) {
        handleError(res, error);
    }
};

export const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.postId;

        // Find the post and populate author
        const post = await Post.findById(postId).populate('author');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = new Comment({
            content,
            author: req.user._id,
            post: postId
        });

        await newComment.save();

        // Add comment to post's comments array
        post.comments.push(newComment._id);
        await post.save();

        // Create notification for comment if the author is not the same as the commenter
        if (post.author._id.toString() !== req.user._id.toString()) {
            const notification = new Notification({
                recipient: post.author._id,
                sender: req.user._id,
                type: 'comment',
                message: 'commented on your post',
                post: post._id,
                read: false
            });
            await notification.save();
        }

        // Populate the comment with author details before sending response
        const populatedComment = await Comment.findById(newComment._id)
            .populate('author', 'name username profilePicture');

        res.status(201).json(populatedComment);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this comment' });
        }
        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            { $set: { content: req.body.content } },
            { new: true }
        );
        res.json(updatedComment);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const post = await Post.findById(comment.post);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (comment.author.toString() !== req.user._id.toString() && 
            post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }
        post.comments = post.comments.filter(id => id.toString() !== comment._id.toString());
        await post.save();
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

export const likeComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)
            .populate('author')
            .populate('post');
            
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const isLiked = comment.likes.includes(req.user._id);
        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            comment.likes.push(req.user._id);

            // Create notification for comment like if the author is not the same as the liker
            if (comment.author._id.toString() !== req.user._id.toString()) {
                const notification = new Notification({
                    recipient: comment.author._id,
                    sender: req.user._id,
                    type: 'like',
                    message: 'liked your comment',
                    post: comment.post._id,
                    read: false
                });
                await notification.save();
            }
        }

        await comment.save();

        // Populate the comment with author details before sending response
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'name username profilePicture');

        res.json(populatedComment);
    } catch (error) {
        handleError(res, error);
    }
};

export const createReply = async (req, res) => {
    try {
        const { content } = req.body;
        const parentComment = await Comment.findById(req.params.commentId)
            .populate('author', 'username profilePicture');
        
        if (!parentComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const reply = new Comment({
            content,
            author: req.user._id,
            post: parentComment.post,
            parentComment: parentComment._id
        });

        await reply.save();
        
        // Initialize replies array if it doesn't exist
        if (!parentComment.replies) {
            parentComment.replies = [];
        }
        
        parentComment.replies.push(reply._id);
        parentComment.replyCount = (parentComment.replyCount || 0) + 1;
        await parentComment.save();

        // Populate the reply with author information
        const populatedReply = await Comment.findById(reply._id)
            .populate('author', 'username profilePicture');

        res.status(201).json(populatedReply);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteReply = async (req, res) => {
    try {
        const reply = await Comment.findById(req.params.id);
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        if (reply.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this reply' });
        }
        
        // Find the parent comment
        const parentComment = await Comment.findById(reply.parentComment);
        if (parentComment) {
            // Safely handle the case where replies might be undefined
            parentComment.replies = (parentComment.replies || []).filter(id => id.toString() !== reply._id.toString());
            parentComment.replyCount = Math.max(0, (parentComment.replyCount || 0) - 1);
            await parentComment.save();
        }
        
        // Delete the reply
        await Comment.findByIdAndDelete(req.params.id);
        
        // Return the updated parent comment if it exists
        if (parentComment) {
            const updatedParent = await Comment.findById(parentComment._id)
                .populate('author', 'username profilePicture')
                .populate({
                    path: 'replies',
                    populate: {
                        path: 'author',
                        select: 'username profilePicture'
                    }
                });
            return res.json(updatedParent);
        }
        
        res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

export const likeReply = async (req, res) => {
    try {
        const reply = await Comment.findById(req.params.id);
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        const isLiked = reply.likes.includes(req.user._id);
        if (isLiked) {
            reply.likes = reply.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            reply.likes.push(req.user._id);
        }
        await reply.save();
        res.json(reply);
    } catch (error) {
        handleError(res, error);
    }
}; 