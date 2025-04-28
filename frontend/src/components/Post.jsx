import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import * as postService from '../api/postService';
import * as commentService from '../api/commentService';
import connectionService from '../api/connectionService';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaTrash, FaEdit, FaLink, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MessageCircle, Share2, User } from 'lucide-react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Post = ({ post, onUpdate, onDelete }) => {
    const navigate = useNavigate();
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
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [connections, setConnections] = useState([]);
    const [selectedConnections, setSelectedConnections] = useState([]);
    const [isLoadingConnections, setIsLoadingConnections] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState({});

    // Create a stable memo to track comments with replies
    const commentsWithReplies = useMemo(() => {
        // Add debugging to check what's coming from the backend
        console.log("Post comments on load:", post.comments);
        
        return post.comments
            .filter(comment => {
                // More detailed check for replies
                const hasReplies = comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0;
                if (comment.replies) {
                    console.log(`Comment ${comment._id} has ${comment.replies.length} replies`, comment.replies);
                }
                return hasReplies;
            })
            .map(comment => ({
                id: comment._id,
                replyCount: comment.replies.length
            }));
    }, [post.comments]);

    // Add a useEffect to fetch the full post with populated replies on load
    useEffect(() => {
        const fetchFullPost = async () => {
            try {
                // Only fetch if we have comments that should have replies but don't
                const hasEmptyRepliesField = post.comments.some(
                    comment => comment.replies === undefined || 
                    (Array.isArray(comment.replies) && comment.replies.length === 0 && comment.replyCount > 0)
                );
                
                if (hasEmptyRepliesField) {
                    console.log("Fetching full post to get replies");
                    const fullPost = await postService.getPost(post._id);
                    if (fullPost) {
                        // Preserve the author data
                        updatePostWithPreservedState({
                            ...fullPost,
                            author: post.author
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching full post:", error);
            }
        };
        
        fetchFullPost();
    }, [post._id]);

    // Initialize expandedReplies state when post loads or changes
    useEffect(() => {
        // Initialize reply visibility state for comments that have replies
        const initialReplyState = { ...expandedReplies };
        
        // Add any new comments with replies
        commentsWithReplies.forEach(comment => {
            if (initialReplyState[comment.id] === undefined) {
                initialReplyState[comment.id] = false; // default to collapsed
            }
        });
        
        // Remove any comments that no longer have replies
        const currentCommentIds = commentsWithReplies.map(c => c.id);
        Object.keys(initialReplyState).forEach(commentId => {
            if (!currentCommentIds.includes(commentId)) {
                delete initialReplyState[commentId];
            }
        });
        
        setExpandedReplies(initialReplyState);
    }, [commentsWithReplies]);

    // Preserve expandedReplies state during operations like liking comments
    const updatePostWithPreservedState = (updatedPost) => {
        onUpdate(updatedPost);
        // Don't reset expandedReplies state here
    };

    const handleLike = async () => {
        try {
            setIsLiking(true);
            const updatedPost = await postService.likePost(post._id);
            updatePostWithPreservedState({
                ...updatedPost,
                author: post.author
            });
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
            setIsLoadingConnections(true);
            console.log('Fetching connections...');
            
            // Direct API call to get connections
            const response = await axios.get('http://localhost:3000/api/v1/connections', {
                withCredentials: true
            });
            
            console.log('Connections fetched:', response.data);
            setConnections(response.data);
            setShowShareDialog(true);
        } catch (error) {
            console.error('Error fetching connections:', error);
            toast.error('Failed to load connections');
        } finally {
            setIsLoadingConnections(false);
        }
    };

    const handleShareToConnections = async () => {
        try {
            setIsSharing(true);
            console.log('Sharing post with connections:', selectedConnections);
            
            // Share post to selected connections via messages
            await Promise.all(selectedConnections.map(async (connectionId) => {
                console.log('Sharing with connection:', connectionId);
                
                // Direct API call to share post
                await axios.post('http://localhost:3000/api/v1/messages/share-post', {
                    recipientId: connectionId,
                    postId: post._id
                }, {
                    withCredentials: true
                });
            }));
            
            setShowShareDialog(false);
            setSelectedConnections([]);
            toast.success(`Post shared with ${selectedConnections.length} connection${selectedConnections.length !== 1 ? 's' : ''}`);
            
            // Redirect to messages if only one connection selected
            if (selectedConnections.length === 1) {
                const recipientId = selectedConnections[0];
                navigate(`/messages?user=${recipientId}`);
            }
        } catch (error) {
            console.error('Error sharing post:', error);
            console.error('Error details:', error.message);
            toast.error('Failed to share post');
        } finally {
            setIsSharing(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            const postUrl = `${window.location.origin}/post/${post._id}`;
            await navigator.clipboard.writeText(postUrl);
            toast.success('Post link copied to clipboard');
            setShowShareDialog(false);
        } catch (error) {
            console.error('Error copying link:', error);
            toast.error('Failed to copy link');
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
            updatePostWithPreservedState(updatedPost);
            
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
            updatePostWithPreservedState({
                ...post,
                ...updatedPost,
                comments: updatedPost.comments.map(comment => ({
                    ...comment,
                    author: comment.author || post.comments.find(c => c._id === comment._id)?.author,
                    replies: comment.replies ? comment.replies.map(reply => ({
                        ...reply,
                        author: reply.author || comment.replies?.find(r => r._id === reply._id)?.author
                    })) : []
                }))
            });
        } catch (error) {
            console.error('Error liking comment:', error);
            toast.error('Failed to like comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmDelete = () => {
            return new Promise((resolve) => {
                toast.custom((t) => (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 mb-4">Are you sure you want to delete this comment?</p>
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
                ), {
                    duration: 5000 // 5 seconds timeout for the confirmation toast
                });
            });
        };

        const shouldDelete = await confirmDelete();
        if (!shouldDelete) return;

            try {
                await commentService.deleteComment(commentId);
                const updatedPost = await postService.getPost(post._id);
                
                // Remove this comment from expandedReplies state
                const newExpandedReplies = {...expandedReplies};
                delete newExpandedReplies[commentId];
                setExpandedReplies(newExpandedReplies);
                
                updatePostWithPreservedState({
                    ...updatedPost,
                    author: post.author,
                    comments: updatedPost.comments.map(comment => ({
                        ...comment,
                        author: comment.author || post.comments.find(c => c._id === comment._id)?.author,
                        replies: comment.replies ? comment.replies.map(reply => ({
                            ...reply,
                            author: reply.author || comment.replies?.find(r => r._id === reply._id)?.author
                        })) : []
                    }))
                });
                toast.success('Comment deleted successfully', {
                    duration: 3000 // 3 seconds timeout for success toast
                });
            } catch (error) {
                console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment', {
                duration: 3000 // 3 seconds timeout for error toast
            });
        }
    };

    const handleReply = async (commentId) => {
        if (!replyContent.trim()) return;
        try {
            const response = await commentService.createReply(commentId, { content: replyContent });
            
            // Update the post with the new reply
            const updatedPost = await postService.getPost(post._id);
            
            // When replying, automatically expand replies for this comment
            setExpandedReplies(prev => ({
                ...prev,
                [commentId]: true
            }));
            
            updatePostWithPreservedState(updatedPost);
            
            setReplyContent('');
            setReplyingTo(null);
            toast.success('Reply added successfully');
        } catch (error) {
            console.error('Error adding reply:', error);
            toast.error('Failed to add reply');
        }
    };

    const handleDeleteReply = async (replyId) => {
        const confirmDelete = () => {
            return new Promise((resolve) => {
                toast.custom((t) => (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 mb-4">Are you sure you want to delete this reply?</p>
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
                ), {
                    duration: 5000 // 5 seconds timeout for the confirmation toast
                });
            });
        };

        const shouldDelete = await confirmDelete();
        if (!shouldDelete) return;

        try {
            const response = await commentService.deleteReply(replyId);
            
            // If we got back the updated parent comment, use it to update the state
            if (response && response._id) {
                updatePostWithPreservedState({
                    ...post,
                    comments: post.comments.map(comment => 
                        comment._id === response._id 
                            ? response 
                            : comment
                    )
                });
            } else {
                // Fallback to fetching the updated post
                const updatedPost = await postService.getPost(post._id);
                updatePostWithPreservedState({
                    ...updatedPost,
                    author: post.author,
                    comments: updatedPost.comments.map(comment => ({
                        ...comment,
                        author: comment.author || post.comments.find(c => c._id === comment._id)?.author,
                        replies: comment.replies ? comment.replies.map(reply => ({
                            ...reply,
                            author: reply.author || comment.replies?.find(r => r._id === reply._id)?.author
                        })) : []
                    }))
                });
            }
            
            toast.success('Reply deleted successfully', {
                duration: 3000 // 3 seconds timeout for success toast
            });
        } catch (error) {
            console.error('Error deleting reply:', error);
            toast.error('Failed to delete reply', {
                duration: 3000 // 3 seconds timeout for error toast
            });
        }
    };

    // Function to toggle showing/hiding replies for a specific comment
    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => {
            // Make sure we have a valid state to work with
            const newState = { ...prev };
            // Toggle the state, defaulting to true if it doesn't exist
            newState[commentId] = !newState[commentId];
            return newState;
        });
    };

    const isLiked = Array.isArray(post.likes) && post.likes.includes(user._id);

    // Add a ProfileImage component to handle null profile pictures
    const ProfileImage = ({ src, alt, size = "medium", className = "" }) => {
        const [imageError, setImageError] = useState(false);
        
        const sizeClasses = {
            small: "w-8 h-8",
            medium: "w-10 h-10",
            large: "w-12 h-12"
        };

        const iconSizes = {
            small: "w-4 h-4",
            medium: "w-5 h-5",
            large: "w-6 h-6"
        };

        if (!src || imageError) {
            return (
                <div className={`${sizeClasses[size]} rounded-full bg-gray-900 flex items-center justify-center ${className}`}>
                    <User className={`${iconSizes[size]} text-white`} />
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
                onError={() => setImageError(true)}
            />
        );
    };

    // Log the author data to debug missing name issue
    useEffect(() => {
        console.log("Post author data:", post.author);
    }, [post.author]);
    
    // Safely access the author name or username
    const authorName = post.author?.name || post.author?.username || "Unknown User";

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <Link to={`/profile/${post.author.username}`}>
                        <ProfileImage
                            src={post.author.profilePicture}
                            alt={authorName}
                            size="large"
                            className="ring-2 ring-gray-200"
                        />
                    </Link>
                    <div>
                        <Link 
                            to={`/profile/${post.author.username}`}
                            className="hover:text-blue-600 transition-colors duration-200"
                        >
                            <h3 className="font-semibold text-gray-800">{authorName}</h3>
                        </Link>
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
                <div className="relative w-full mb-4">
                    <img
                        src={post.image}
                        alt="Post content"
                        className="w-full rounded-lg object-cover max-h-96"
                        onError={(e) => {
                            console.error('Image load error:', e);
                            console.log('Failed image URL:', post.image);
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = '/placeholder-image.png'; // Fallback image
                            toast.error('Failed to load image');
                        }}
                        onLoad={(e) => {
                            console.log('Image loaded successfully:', post.image);
                        }}
                        loading="lazy"
                    />
                </div>
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
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="mb-4">
                        <div className="flex items-start space-x-3">
                            <ProfileImage
                                src={user.profilePicture}
                                alt={user.username}
                                size="medium"
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
                                <ProfileImage
                                    src={comment.author.profilePicture}
                                    alt={comment.author?.username || 'Unknown'}
                                    size="medium"
                                />
                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-800">
                                                    {comment.author?.name || comment.author?.username || 'Unknown User'}
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
                                            {(comment.replies && comment.replies.length > 0) || comment.replyCount > 0 ? (
                                                <button
                                                    onClick={() => toggleReplies(comment._id)}
                                                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition-colors duration-200"
                                                >
                                                    <span>
                                                        {expandedReplies[comment._id] ? 'Hide' : 'Show'} 
                                                        {' replies '}
                                                        ({(comment.replies && comment.replies.length) || comment.replyCount || 0})
                                                    </span>
                                                    {expandedReplies[comment._id] ? (
                                                        <FaChevronUp size={10} />
                                                    ) : (
                                                        <FaChevronDown size={10} />
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-sm text-gray-400 flex items-center space-x-1">
                                                    <span className="italic">No replies yet</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {replyingTo === comment._id && (
                                        <div className="mt-2 ml-4">
                                            <div className="flex items-center space-x-2">
                                                <ProfileImage
                                                    src={user.profilePicture}
                                                    alt={user.username}
                                                    size="small"
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

                                    {comment.replies && comment.replies.length > 0 && expandedReplies[comment._id] && (
                                        <div className="ml-4 mt-2 space-y-2">
                                            {comment.replies.map((reply) => (
                                                <div key={reply._id} className="flex items-start space-x-2">
                                                    <ProfileImage
                                                        src={reply.author.profilePicture}
                                                        alt={reply.author?.username || 'Unknown'}
                                                        size="small"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="bg-gray-50 rounded-lg p-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h5 className="font-semibold text-sm text-gray-800">
                                                                        {reply.author?.name || reply.author?.username || 'Unknown User'}
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

            {/* Share Dialog */}
            {showShareDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Share Post</h3>
                            <button
                                onClick={() => setShowShareDialog(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        {isLoadingConnections ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-gray-600 mb-2">You don't have any connections yet.</p>
                                <Link to="/network" className="text-blue-500 hover:underline">
                                    Find people to connect with
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="max-h-60 overflow-y-auto mb-4">
                                    {connections.map((connection) => (
                                        <div key={connection._id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                            <div className="flex items-center">
                                                <ProfileImage
                                                    src={connection.profilePicture}
                                                    alt={connection.name}
                                                    size="small"
                                                    className="mr-3"
                                                />
                                                <span>{connection.name}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selectedConnections.includes(connection._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedConnections([...selectedConnections, connection._id]);
                                                    } else {
                                                        setSelectedConnections(selectedConnections.filter(id => id !== connection._id));
                                                    }
                                                }}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-between pt-4 border-t">
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <FaLink className="mr-2" /> Copy Link
                                    </button>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setShowShareDialog(false)}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleShareToConnections}
                                            disabled={isSharing || selectedConnections.length === 0}
                                            className={`px-4 py-2 rounded ${
                                                selectedConnections.length === 0 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                        >
                                            {isSharing ? 'Sharing...' : 'Share'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
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
            name: PropTypes.string.isRequired,
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
                likes: PropTypes.arrayOf(PropTypes.string).isRequired,
                replies: PropTypes.arrayOf(
                    PropTypes.shape({
                        _id: PropTypes.string.isRequired,
                        content: PropTypes.string.isRequired,
                        author: PropTypes.shape({
                            _id: PropTypes.string.isRequired,
                            username: PropTypes.string.isRequired,
                            profilePicture: PropTypes.string
                        }).isRequired
                    })
                )
            })
        ).isRequired,
        createdAt: PropTypes.string.isRequired,
        image: PropTypes.string
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

export default Post; 