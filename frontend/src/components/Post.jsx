import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import * as postService from '../api/postService';
import * as commentService from '../api/commentService';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaTrash, FaEdit } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

export const Post = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handleLike = async () => {
        try {
            setIsLiking(true);
            const updatedPost = await postService.likePost(post._id);
            onUpdate(updatedPost);
            toast.success('Post liked successfully');
        } catch (error) {
            console.error('Error liking post:', error);
            toast.error('Failed to like post');
        } finally {
            setIsLiking(false);
        }
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            const sharedPost = await postService.sharePost(post._id);
            onUpdate(sharedPost);
            toast.success('Post shared successfully');
        } catch (error) {
            console.error('Error sharing post:', error);
            toast.error('Failed to share post');
        } finally {
            setIsSharing(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('content', editedContent);
            
            // Optimistically update the UI
            onUpdate({
                ...post,
                content: editedContent
            });
            
            // Make the API call
            const updatedPost = await postService.updatePost(post._id, formData);
            
            // Update with the server response
            onUpdate(updatedPost);
            setIsEditing(false);
            toast.success('Post updated successfully');
        } catch (error) {
            console.error('Error updating post:', error);
            // Revert the optimistic update
            onUpdate(post);
            toast.error('Failed to update post');
        }
    };

    const handleDelete = async () => {
        const confirmDelete = () => {
            return new Promise((resolve) => {
                toast.custom((t) => (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 mb-4">Are you sure you want to delete this post?</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(false);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(true);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ));
            });
        };

        const shouldDelete = await confirmDelete();
        if (!shouldDelete) return;

        try {
            // Optimistically remove the post from the UI
            onDelete(post._id);
            
            // Make the API call
            await postService.deletePost(post._id);
            
            toast.success('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            // Revert the optimistic update by fetching the posts again
            try {
                const posts = await postService.getAllPosts();
                onUpdate(posts);
            } catch (fetchError) {
                console.error('Error fetching posts after delete failure:', fetchError);
            }
            toast.error('Failed to delete post');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            setIsSubmittingComment(true);
            const response = await commentService.addComment(post._id, newComment);
            
            // Update the post with the new comment
            const updatedPost = await postService.getPost(post._id);
            onUpdate(updatedPost);
            
            setNewComment('');
            toast.success('Comment added successfully');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            await commentService.likeComment(commentId);
            const updatedPost = await postService.getPost(post._id);
            onUpdate({
                ...post,
                ...updatedPost,
                comments: updatedPost.comments.map(comment => ({
                    ...comment,
                    author: comment.author || post.comments.find(c => c._id === comment._id)?.author
                }))
            });
        } catch (error) {
            console.error('Error liking comment:', error);
            toast.error('Failed to like comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await commentService.deleteComment(commentId);
                const updatedPost = await postService.getPost(post._id);
                onUpdate(updatedPost);
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        }
    };

    const handleReply = async (commentId) => {
        if (!replyContent.trim()) return;
        try {
            const response = await commentService.createReply(commentId, { content: replyContent });
            
            // Update the post with the new reply
            const updatedPost = await postService.getPost(post._id);
            onUpdate(updatedPost);
            
            setReplyContent('');
            setReplyingTo(null);
            toast.success('Reply added successfully');
        } catch (error) {
            console.error('Error adding reply:', error);
            toast.error('Failed to add reply');
        }
    };

    const handleDeleteReply = async (replyId) => {
        if (window.confirm('Are you sure you want to delete this reply?')) {
            try {
                await commentService.deleteReply(replyId);
                const updatedPost = await postService.getPost(post._id);
                onUpdate({
                    ...post,
                    ...updatedPost,
                    comments: updatedPost.comments.map(comment => ({
                        ...comment,
                        author: comment.author || post.comments.find(c => c._id === comment._id)?.author
                    }))
                });
                toast.success('Reply deleted successfully');
            } catch (error) {
                console.error('Error deleting reply:', error);
                toast.error('Failed to delete reply');
            }
        }
    };

    const isLiked = Array.isArray(post.likes) && post.likes.includes(user._id);

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <img
                        src={post.author.profilePicture || '/default-avatar.png'}
                        alt={post.author.username}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                    />
                    <div>
                        <h3 className="font-semibold text-gray-800">{post.author.username}</h3>
                        <p className="text-gray-500 text-sm">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                {post.author._id === user._id && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-gray-500 hover:text-blue-500 transition-colors duration-200"
                        >
                            <FaEdit />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="mb-4">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        rows="3"
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <p className="mb-4 text-gray-700">{post.content}</p>
            )}

            {post.image && (
                <img
                    src={post.image}
                    alt="Post content"
                    className="w-full rounded-lg mb-4 object-cover max-h-96"
                />
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-6">
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`flex items-center space-x-1 transition-colors duration-200 ${
                            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                    >
                        {isLiked ? <FaHeart /> : <FaRegHeart />}
                        <span>{post.likes.length}</span>
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                    >
                        <FaComment />
                        <span>{post.comments.length}</span>
                    </button>
                </div>
                <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="text-gray-500 hover:text-blue-500 transition-colors duration-200"
                >
                    <FaShare />
                </button>
            </div>

            {showComments && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="mb-4">
                        <div className="flex items-start space-x-3">
                            <img
                                src={user.profilePicture || '/default-avatar.png'}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm min-h-[60px]"
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleAddComment}
                                        disabled={isSubmittingComment || !newComment.trim()}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                            isSubmittingComment || !newComment.trim()
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                    >
                                        {isSubmittingComment ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {post.comments.map((comment) => (
                            <div key={comment._id} className="flex items-start space-x-3">
                                <img
                                    src={comment.author.profilePicture || '/default-avatar.png'}
                                    alt={comment.author.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-800">
                                                    {comment.author.username}
                                                </h4>
                                                <p className="text-sm mt-1 text-gray-700">{comment.content}</p>
                                            </div>
                                            {(comment.author._id === user._id ||
                                                post.author._id === user._id) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center mt-2 space-x-4">
                                            <button
                                                onClick={() => handleLikeComment(comment._id)}
                                                className={`flex items-center space-x-1 text-sm transition-colors duration-200 ${
                                                    comment.likes.includes(user._id)
                                                        ? 'text-red-500'
                                                        : 'text-gray-500 hover:text-red-500'
                                                }`}
                                            >
                                                {comment.likes.includes(user._id) ? (
                                                    <FaHeart size={12} />
                                                ) : (
                                                    <FaRegHeart size={12} />
                                                )}
                                                <span>{comment.likes.length}</span>
                                            </button>
                                            <button
                                                onClick={() => setReplyingTo(comment._id)}
                                                className="text-sm text-gray-500 hover:text-blue-500 transition-colors duration-200"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>

                                    {replyingTo === comment._id && (
                                        <div className="mt-2 ml-4">
                                            <div className="flex items-center space-x-2">
                                                <img
                                                    src={user.profilePicture || '/default-avatar.png'}
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleReply(comment._id)}
                                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="ml-4 mt-2 space-y-2">
                                            {comment.replies.map((reply) => (
                                                <div key={reply._id} className="flex items-start space-x-2">
                                                    <img
                                                        src={reply.author.profilePicture || '/default-avatar.png'}
                                                        alt={reply.author.username}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="bg-gray-50 rounded-lg p-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h5 className="font-semibold text-sm text-gray-800">
                                                                        {reply.author.username}
                                                                    </h5>
                                                                    <p className="text-sm text-gray-700">{reply.content}</p>
                                                                </div>
                                                                {reply.author._id === user._id && (
                                                                    <button
                                                                        onClick={() => handleDeleteReply(reply._id)}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

Post.propTypes = {
    post: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        author: PropTypes.shape({
            _id: PropTypes.string.isRequired,
            username: PropTypes.string.isRequired,
            profilePicture: PropTypes.string
        }).isRequired,
        likes: PropTypes.arrayOf(PropTypes.string).isRequired,
        comments: PropTypes.arrayOf(
            PropTypes.shape({
                _id: PropTypes.string.isRequired,
                content: PropTypes.string.isRequired,
                author: PropTypes.shape({
                    _id: PropTypes.string.isRequired,
                    username: PropTypes.string.isRequired,
                    profilePicture: PropTypes.string
                }).isRequired,
                likes: PropTypes.arrayOf(PropTypes.string).isRequired
            })
        ).isRequired,
        createdAt: PropTypes.string.isRequired
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
}; 