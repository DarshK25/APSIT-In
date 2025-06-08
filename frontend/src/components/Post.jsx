import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import * as postService from '../api/postService';
import * as commentService from '../api/commentService';
import connectionService from '../api/connectionService';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaTrash, FaEdit, FaLink, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MessageCircle, Share2, User as UserIcon, Reply } from 'lucide-react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Post = ({ post, onUpdate, onDelete, user: currentUser }) => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const user = currentUser || authUser; // Use user prop if provided, otherwise use authUser
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLikedByModalOpen, setIsLikedByModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 dark:text-dark-text-primary mb-4">Are you sure you want to delete this post?</p>
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
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 dark:text-dark-text-primary mb-4">Are you sure you want to delete this comment?</p>
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
                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-lg">
                        <p className="text-gray-800 dark:text-dark-text-primary mb-4">Are you sure you want to delete this reply?</p>
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

    const isLiked = Array.isArray(post.likes) && post.likes.includes(user?._id);

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
                <div className={`${sizeClasses[size]} rounded-full bg-gray-900 dark:bg-dark-hover flex items-center justify-center ${className}`}>
                    <UserIcon className={`${iconSizes[size]} text-white`} />
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
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
            {/* Post Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border">
                <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                        <Link to={`/profile/${post.author?.username}`} className="flex-shrink-0">
                            <ProfileImage
                                src={post.author?.profilePicture}
                                alt={post.author?.name}
                                size="large"
                                className="ring-2 ring-gray-100 dark:ring-dark-border"
                            />
                    </Link>
                        <div className="flex-1 min-w-0">
                            <Link to={`/profile/${post.author?.username}`} className="text-sm sm:text-base font-semibold text-gray-900 dark:text-dark-text-primary hover:underline">
                                {post.author?.username || 'Unknown User'}
                        </Link>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                    {user?._id === post.author?._id && (
                        <div className="flex items-center space-x-2">
                        <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-primary rounded-full hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                        >
                                <FaEdit size={16} />
                        </button>
                        <button
                            onClick={handleDelete}
                                className="p-1.5 text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                        >
                                <FaTrash size={16} />
                        </button>
                    </div>
                )}
                </div>
            </div>

            {/* Post Content */}
            <div className="p-4 sm:p-6">
            {isEditing ? (
                    <div className="space-y-4">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[100px] text-gray-700 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted bg-white dark:bg-dark-hover"
                    />
                        <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setIsEditing(false)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                    <div className="text-sm sm:text-base text-gray-700 dark:text-dark-text-primary whitespace-pre-wrap">
                        {post.content}
                    </div>
            )}
            {post.image && (
                    <div className="mt-4 rounded-xl overflow-hidden">
                    <img
                        src={post.image}
                            alt="Post attachment"
                            className="w-full h-auto max-h-[400px] object-cover"
                    />
                </div>
            )}
            </div>

            {/* Post Actions */}
            <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                            className="flex items-center space-x-1 text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                            {post.likes?.includes(user?._id) ? (
                                <FaHeart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                            ) : (
                                <FaRegHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                            <span className="text-sm sm:text-base">{post.likes?.length || 0}</span>
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                            className="flex items-center space-x-1 text-gray-500 dark:text-dark-text-muted hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-sm sm:text-base">{post.comments?.length || 0}</span>
                    </button>
                    <button
                        onClick={handleShare}
                            className="flex items-center space-x-1 text-gray-500 dark:text-dark-text-muted hover:text-green-500 dark:hover:text-green-400 transition-colors"
                    >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-gray-200 dark:border-dark-border">
                    <div className="p-4 sm:p-6 space-y-4">
                        {/* New Comment Input */}
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <ProfileImage
                                    src={user?.profilePicture}
                                    alt={user?.name}
                                    size="large"
                                    className="ring-2 ring-gray-100 dark:ring-dark-border"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[60px] text-gray-700 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted bg-white dark:bg-dark-hover"
                                    />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleAddComment}
                                        disabled={isSubmittingComment || !newComment.trim()}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Comment
                                    </button>
                            </div>
                        </div>
                    </div>

                        {/* Comments List */}
                    <div className="space-y-4">
                            {post.comments?.map((comment) => (
                                <div key={comment._id} className="space-y-2">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <ProfileImage
                                                src={comment.author?.profilePicture}
                                                alt={comment.author?.name}
                                                size="large"
                                                className="ring-2 ring-gray-100 dark:ring-dark-border"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-3 sm:p-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Link to={`/profile/${comment.author?.username}`} className="text-sm sm:text-base font-semibold text-gray-900 dark:text-dark-text-primary hover:underline">
                                                        {comment.author?.name || comment.author?.username || 'Unknown User'}
                                                    </Link>
                                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted">
                                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm sm:text-base text-gray-700 dark:text-dark-text-primary">
                                                    {comment.content}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-2">
                                            <button
                                                onClick={() => handleLikeComment(comment._id)}
                                                    className="flex items-center space-x-1 text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                >
                                                    {comment.likes?.includes(user?._id) ? (
                                                        <FaHeart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                                                    ) : (
                                                        <FaRegHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    )}
                                                    <span className="text-xs sm:text-sm">{comment.likes?.length || 0}</span>
                                                </button>
                                                <button
                                                    onClick={() => setReplyingTo(comment._id)}
                                                    className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    <span>Reply</span>
                                                </button>
                                                {user?._id === comment.author?._id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                    >
                                                        <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span>Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Replies Section */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="ml-12 sm:ml-14 space-y-3">
                                                    {expandedReplies[comment._id] ? (
                                                <>
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply._id} className="flex items-start space-x-3">
                                                            <div className="flex-shrink-0">
                                                                <ProfileImage
                                                                    src={reply.author?.profilePicture}
                                                                    alt={reply.author?.name}
                                                                    size="small"
                                                                    className="ring-2 ring-gray-100 dark:ring-dark-border"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-2 sm:p-3">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <Link to={`/profile/${reply.author?.username}`} className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-dark-text-primary hover:underline">
                                                                            {reply.author?.username || 'Unknown User'}
                                                                        </Link>
                                                                        <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                                                                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-dark-text-primary">
                                                                        {reply.content}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center space-x-4 mt-1">
                                                                    <button
                                                                        onClick={() => handleLikeComment(reply._id)}
                                                                        className="flex items-center space-x-1 text-xs text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                                    >
                                                                        {reply.likes?.includes(user?._id) ? (
                                                                            <FaHeart className="w-3 h-3 text-red-500" />
                                                                        ) : (
                                                                            <FaRegHeart className="w-3 h-3" />
                                                                        )}
                                                                        <span className="text-xs">{reply.likes?.length || 0}</span>
                                                                    </button>
                                                                    {user?._id === reply.author?._id && (
                                                                        <button
                                                                            onClick={() => handleDeleteReply(reply._id)}
                                                                            className="flex items-center space-x-1 text-xs text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                                        >
                                                                            <FaTrash className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => toggleReplies(comment._id)}
                                                        className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        <FaChevronUp className="inline-block w-3 h-3 mr-1" />
                                                        Hide Replies
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => toggleReplies(comment._id)}
                                                    className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <FaChevronDown className="inline-block w-3 h-3 mr-1" />
                                                    Show {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Reply Input */}
                                    {replyingTo === comment._id && (
                                        <div className="ml-12 sm:ml-14 mt-3">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    <ProfileImage
                                                        src={user?.profilePicture}
                                                        alt={user?.name}
                                                        size="large"
                                                        className="ring-2 ring-gray-100 dark:ring-dark-border"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[40px] text-gray-700 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted bg-white dark:bg-dark-hover"
                                                    />
                                                    <div className="flex justify-end mt-2 space-x-2">
                                                <button
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyContent('');
                                                            }}
                                                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
                                                        >
                                                            Cancel
                                                </button>
                                                                    <button
                                                            onClick={() => handleReply(comment._id)}
                                                            disabled={!replyContent.trim()}
                                                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                            Reply
                                                                    </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                        </div>
                                    )}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Dialog */}
            {showShareDialog && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-dark-text-primary">
                                Share Post
                            </h3>
                            <button
                                onClick={() => setShowShareDialog(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="max-h-60 overflow-y-auto">
                                {isLoadingConnections ? (
                                    <div className="flex justify-center items-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : connections.length > 0 ? (
                                    <div className="space-y-2">
                                        {connections.map((connection) => (
                                            <label
                                                key={connection._id}
                                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer"
                                            >
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
                                                    className="rounded text-blue-500 focus:ring-blue-500"
                                                />
                                                <div className="flex items-center space-x-3">
                                                    {connection.profilePicture ? (
                                                        <img
                                                            src={connection.profilePicture}
                                                            alt={connection.name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-dark-hover flex items-center justify-center text-white">
                                                            <UserIcon className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm sm:text-base text-gray-700 dark:text-dark-text-primary">
                                                        {connection.name}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-dark-text-muted text-center py-4">
                                        No connections found
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowShareDialog(false)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleShareToConnections}
                                    disabled={selectedConnections.length === 0 || isSharing}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSharing ? 'Sharing...' : 'Share'}
                                </button>
                            </div>
                        </div>
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
            name: PropTypes.string,
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
                    name: PropTypes.string,
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
                            name: PropTypes.string,
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
    onDelete: PropTypes.func.isRequired,
    user: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        name: PropTypes.string,
        profilePicture: PropTypes.string
    }).isRequired
};

export default Post; 