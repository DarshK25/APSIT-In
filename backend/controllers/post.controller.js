import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import { handleError } from '../utils/errorHandler.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import cloudinary from '../lib/cloudinary.js';

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file) => {
    try {
        // Convert buffer to base64
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = "data:" + file.mimetype + ";base64," + b64;
        
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'posts',
            resource_type: 'auto'
        });
        
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Failed to upload image');
    }
};

export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        let imageUrl = null;

        // If there's an uploaded file, upload to Cloudinary
        if (req.file) {
            try {
                imageUrl = await uploadToCloudinary(req.file);
                console.log('Uploaded image URL:', imageUrl); // Debug log
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({ message: 'Failed to upload image' });
            }
        }

        const newPost = new Post({
            content,
            image: imageUrl,
            author: req.user._id
        });

        await newPost.save();
        console.log('Saved post:', newPost); // Debug log

        // Populate the author details before sending response
        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'name username profilePicture')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'name username profilePicture'
                }
            });

        console.log('Populated post:', populatedPost); // Debug log
        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error in createPost:', error);
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
                        model: 'Comment',
                        populate: {
                            path: 'author',
                            select: 'username profilePicture'
                        }
                    }
                ]
            })
            .lean();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Ensure each comment has a replies array
        post.comments = post.comments.map(comment => ({
            ...comment,
            replies: comment.replies || []
        }));

        res.json(post);
    } catch (error) {
        handleError(res, error);
    }
};

export const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get the user's connections from the User model
        const user = await User.findById(userId);
        const connections = user.connections || [];

        // Get posts from the user and their connections
        const posts = await Post.find({
            $or: [
                { author: userId },
                { author: { $in: connections } }
            ]
        })
        .populate('author', 'name username profilePicture')
        .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'name username profilePicture'
            }
        })
        .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        handleError(res, error);
    }
};

export const updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        
        // Get the existing post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is authorized to update the post
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }

        // Update the post data
        const updateData = { content };

        // If there's a new image uploaded
        if (req.file) {
            try {
                const imageUrl = await uploadToCloudinary(req.file);
                updateData.image = imageUrl;
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({ message: 'Failed to upload image' });
            }
        }

        // Update the post
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            updateData,
            { new: true }
        ).populate('author', 'name username profilePicture')
         .populate({
             path: 'comments',
             populate: {
                 path: 'author',
                 select: 'name username profilePicture'
             }
         });

        console.log('Updated post:', updatedPost); // Debug log
        res.json(updatedPost);
    } catch (error) {
        console.error('Error in updatePost:', error);
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
        const post = await Post.findById(req.params.id).populate('author');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const isLiked = post.likes.includes(req.user._id);
        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
            
            // Create notification for post like if the author is not the same as the liker
            if (post.author._id.toString() !== req.user._id.toString()) {
                const notification = new Notification({
                    recipient: post.author._id,
                    sender: req.user._id,
                    type: 'like',
                    message: 'liked your post',
                    post: post._id,
                    read: false
                });
                await notification.save();
            }
        }
        await post.save();
        
        // Populate the post with author details before sending response
        const populatedPost = await Post.findById(post._id)
            .populate('author', 'name username profilePicture')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'name username profilePicture'
                }
            });
            
        res.json(populatedPost);
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