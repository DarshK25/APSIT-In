import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";

export const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.postId;

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }

        const comment = new Comment({
            author: req.user._id,
            post: postId,
            content,
            likes: [],
            replies: [],
        });

        await comment.save();

        post.comments.push(comment._id);
        await post.save();

        // Populate the comment with author details
        const populatedComment = await Comment.findById(comment._id)
            .populate("author", "name username profilePicture headline");

        // Get updated post with all comments
        const updatedPost = await Post.findById(postId)
            .populate("author", "name username profilePicture headline")
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "name username profilePicture"
                }
            });

        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            comment: populatedComment,
            post: updatedPost
        });
    } catch (error) {
        console.error("Error in createComment: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }   
}

export const updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        const commentId = req.params.commentId;

        const comment = await Comment.findById(commentId).populate("author", "name profilePicture");

        if(!comment){
            return res.status(404).json({success: false, message: "Comment not found"});
        }

        if(comment.author.toString() !== req.user._id.toString()){
            return res.status(403).json({success: false, message: "You are not authorized to update this comment."});
        }

        comment.content = content;
        await comment.save();

        res.status(200).json({success: true, message: "Comment updated successfully", comment});
    } catch (error) {
        console.error("Error in updateComment: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        // Find the comment and populate post details
        const comment = await Comment.findById(commentId).populate('post');
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const { post } = comment;

        // Check authorization: Either the comment author or the post author can delete the comment
        const isAuthorized = 
            comment.author.toString() === userId.toString() || 
            post.author.toString() === userId.toString();

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this comment." });
        }

        // Remove the comment ID from the post's comments array and delete the comment
        await post.updateOne({ $pull: { comments: commentId } });
        await comment.remove();

        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error in deleteComment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const likeComment = async (req, res) => {
    try{
        const commentId = req.params.commentId;

        const userId = req.user._id;

        const comment = await Comment.findById(commentId).populate("author", "name profilePicture");
        if(!comment){
            return res.status(404).json({success: false, message: "Comment not found"});
        }

        const isLiked = comment.likes.includes(userId);
        if(isLiked){
            comment.likes.pull(userId); 
        } else {
            comment.likes.push(userId); 
        }
        await comment.save();

        res.status(200).json({
            success: true,
            message: `Comment ${isLiked ? 'unliked' : 'liked'} successfully`,
            comment,
        });
    } catch (error) {
        console.error("Error in likeComment: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export const replyToComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.postId;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const reply = new Comment({
            author: req.user._id,
            post: postId,
            content,
            likes: [],
            replies: [],
        });

        await reply.save();

        // Add reply ID to the parent comment's replies array
        comment.replies.push(reply._id);
        await comment.save();

        // Populate reply's author for response
        const populatedReply = await reply.populate("author", "name profilePicture");

        res.status(201).json({
            success: true,
            message: "Reply created successfully",
            reply: populatedReply,
        });
    } catch (error) {
        console.error("Error in replyToComment: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};