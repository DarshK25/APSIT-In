import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import { handleError } from '../utils/errorHandler.js';

export const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const newComment = new Comment({
            content,
            author: req.user._id,
            post: req.params.postId
        });
        await newComment.save();
        post.comments.push(newComment._id);
        await post.save();
        res.status(201).json(newComment);
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
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const isLiked = comment.likes.includes(req.user._id);
        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            comment.likes.push(req.user._id);
        }
        await comment.save();
        res.json(comment);
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
        const parentComment = await Comment.findById(reply.parentComment);
        if (parentComment) {
            parentComment.replies = parentComment.replies.filter(id => id.toString() !== reply._id.toString());
            await parentComment.save();
        }
        await Comment.findByIdAndDelete(req.params.id);
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