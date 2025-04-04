import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import { handleError } from '../utils/errorHandler.js';
import Connection from '../models/connection.model.js';

export const createPost = async (req, res) => {
    try {
        const { content, image } = req.body;
        const newPost = new Post({
            content,
            image,
            author: req.user._id
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        handleError(res, error);
    }
};

export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username profilePicture')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'author',
                        select: 'username profilePicture'
                    },
                    {
                        path: 'replies',
                        populate: {
                            path: 'author',
                            select: 'username profilePicture'
                        }
                    }
                ]
            });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        handleError(res, error);
    }
};

export const getFeedPosts = async (req, res) => {
    try {
        // Get all accepted connections for the current user
        const connections = await Connection.find({
            $or: [
                { sender: req.user._id, status: 'accepted' },
                { recipient: req.user._id, status: 'accepted' }
            ]
        });

        // Extract all connected user IDs
        const connectedUserIds = connections.map(conn => 
            conn.sender.toString() === req.user._id.toString() 
                ? conn.recipient.toString() 
                : conn.sender.toString()
        );

        // Add current user's ID to see their own posts
        connectedUserIds.push(req.user._id.toString());

        // Get posts from connected users
        const posts = await Post.find({
            author: { $in: connectedUserIds }
        })
        .sort({ createdAt: -1 })
        .populate('author', 'username profilePicture')
        .populate({
            path: 'comments',
            populate: [
                {
                    path: 'author',
                    select: 'username profilePicture'
                },
                {
                    path: 'replies',
                    populate: {
                        path: 'author',
                        select: 'username profilePicture'
                    }
                }
            ]
        });

        res.json(posts);
    } catch (error) {
        handleError(res, error);
    }
};

export const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedPost);
    } catch (error) {
        handleError(res, error);
    }
};

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }
        await Comment.deleteMany({ post: req.params.id });
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const isLiked = post.likes.includes(req.user._id);
        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }
        await post.save();
        res.json(post);
    } catch (error) {
        handleError(res, error);
    }
};

export const sharePost = async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.id);
        if (!originalPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const newPost = new Post({
            content: originalPost.content,
            image: originalPost.image,
            author: req.user._id,
            sharedFrom: originalPost._id
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        handleError(res, error);
    }
};

export const cleanupOrphanedComments = async () => {
    try {
        const posts = await Post.find();
        const postIds = posts.map(post => post._id);
        await Comment.deleteMany({ post: { $nin: postIds } });
    } catch (error) {
        console.error('Error cleaning up orphaned comments:', error);
    }
}; 