import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { getUserPosts, getPublicProfile } from '../api/userService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { FaHeart, FaRegComment, FaEdit, FaTrash, FaShareAlt, FaRegHeart, FaReply } from 'react-icons/fa';
import { Plus, User } from 'lucide-react';
import { createPost, deletePost, updatePost, likePost, sharePost } from '../api/postService';
import { addComment, likeComment, deleteComment, createReply, deleteReply, getCommentsByPostId } from '../api/commentService';
import connectionService from '../api/connectionService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Memoized ProfileImage component
const ProfileImage = memo(({ src, alt, size = "medium", className = "" }) => {
    const [imageError, setImageError] = useState(false);
    
    const sizeClasses = {
        small: "w-6 h-6",
        medium: "w-8 h-8",
        large: "w-10 h-10"
    };

    const iconSizes = {
        small: "w-3 h-3",
        medium: "w-4 h-4",
        large: "w-5 h-5"
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
            alt={alt || "User"}
            className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
            onError={() => setImageError(true)}
        />
    );
});

ProfileImage.displayName = 'ProfileImage';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';
  try {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  } catch (error) {
    return 'Just now';
  }
};

// Add this new component for Comments Section
const CommentSection = ({ post, user, onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [isSubmittingReply, setIsSubmittingReply] = useState({});
  const [comments, setComments] = useState(post.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Only fetch comments if they're not already in the post prop
  useEffect(() => {
    const fetchComments = async () => {
      if (!post?._id || post.comments?.length > 0) return;
      
      try {
        setIsLoadingComments(true);
        const commentData = await getCommentsByPostId(post._id);
        console.log("Fetched comments:", commentData);
        setComments(commentData || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setIsLoadingComments(false);
      }
    };
    
    fetchComments();
  }, [post._id, post.comments]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const addedComment = await addComment(post._id, newComment.trim());
      // Update comments with the new comment
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
      toast.success('Comment added successfully');
      // Notify parent component to refresh posts
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyContent[commentId]?.trim() || isSubmittingReply[commentId]) return;

    try {
      setIsSubmittingReply(prev => ({ ...prev, [commentId]: true }));
      await createReply(commentId, { content: replyContent[commentId].trim() });
      // Refresh comments after adding a reply
      const updatedComments = await getCommentsByPostId(post._id);
      setComments(updatedComments || []);
      setReplyContent(prev => ({ ...prev, [commentId]: '' }));
      toast.success('Reply added successfully');
    } catch (error) {
      toast.error('Failed to add reply');
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      await likeComment(commentId);
      // Refresh comments after liking
      const updatedComments = await getCommentsByPostId(post._id);
      setComments(updatedComments || []);
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
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
                className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
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
        ), { duration: 5000 });
      });
    };

    const shouldDelete = await confirmDelete();
    if (!shouldDelete) return;

    try {
      await deleteComment(commentId);
      await fetchPosts(); // Refresh posts to get updated comments
      toast.success('Comment deleted successfully', { duration: 3000 });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment', { duration: 3000 });
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
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
                className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
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
        ), { duration: 5000 });
      });
    };

    const shouldDelete = await confirmDelete();
    if (!shouldDelete) return;

    try {
      await deleteReply(replyId);
      // Refresh comments after deleting reply
      const updatedComments = await getCommentsByPostId(post._id);
      setComments(updatedComments || []);
      toast.success('Reply deleted successfully');
    } catch (error) {
      toast.error('Failed to delete reply');
    }
  };

  // Use actual comment data instead of post.comments
  const displayComments = comments.length > 0 ? comments : post.comments || [];
  const commentCount = displayComments.length;

  return (
    <div className="mt-4 space-y-6">
      {/* Comment Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
          {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'No comments yet'}
        </h3>
      </div>

      {/* Comment Input */}
      {user && (
        <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
          <ProfileImage
            src={user.profilePicture}
            alt={user.name || user.username || "User"}
            size="medium"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary-light focus:border-transparent text-gray-700 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                !newComment.trim() || isSubmitting 
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-blue-500 hover:text-blue-600 dark:text-primary dark:hover:text-primary-light cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 dark:border-primary border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Comments Loading State */}
      {isLoadingComments && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 dark:border-primary border-t-transparent"></div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {displayComments.map((comment) => (
          <div key={comment._id} className="group">
            <div className="flex space-x-3">
              <ProfileImage
                src={comment.author?.profilePicture}
                alt={comment.author?.name || comment.author?.username || "User"}
                size="medium"
              />
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 py-2.5 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                        {comment.author?.name || comment.author?.username || "Unknown User"}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-dark-text-muted">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>
                    {comment.author?._id === user?._id && (
                      <button
                        onClick={() => handleDeleteComment(post._id, comment._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-dark-text-secondary">{comment.content}</p>
                </div>

                {/* Comment Actions */}
                <div className="flex items-center space-x-4 mt-1 ml-4">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`flex items-center space-x-1 text-sm cursor-pointer ${
                      comment.likes?.includes(user?._id)
                        ? 'text-red-500'
                        : 'text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400'
                    } transition duration-200`}
                  >
                    {comment.likes?.includes(user?._id) ? (
                      <FaHeart className="h-4 w-4" />
                    ) : (
                      <FaRegHeart className="h-4 w-4" />
                    )}
                    <span>{comment.likes?.length || 0}</span>
                  </button>

                  {user && (
                    <button
                      onClick={() => toggleReplies(comment._id)}
                      className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-blue-500 transition duration-200 cursor-pointer dark:text-dark-text-muted dark:hover:text-primary-light"
                    >
                      <FaReply className="h-4 w-4" />
                      <span>Reply</span>
                    </button>
                  )}

                  {(comment.replies?.length > 0) && (
                    <button
                      onClick={() => toggleReplies(comment._id)}
                      className="text-sm text-gray-500 hover:text-blue-500 transition duration-200 cursor-pointer dark:text-dark-text-muted dark:hover:text-primary-light"
                    >
                      {showReplies[comment._id] ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>

                {/* Reply Input */}
                {showReplies[comment._id] && user && (
                  <div className="mt-3 ml-8">
                    <div className="flex items-start space-x-2">
                      <ProfileImage
                        src={user.profilePicture}
                        alt={user.name || user.username || "User"}
                        size="small"
                      />
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={replyContent[comment._id] || ''}
                          onChange={(e) => setReplyContent(prev => ({
                            ...prev,
                            [comment._id]: e.target.value
                          }))}
                          placeholder="Write a reply..."
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary-light focus:border-transparent text-sm text-gray-700 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted"
                          onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(comment._id)}
                        />
                        {isSubmittingReply[comment._id] && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 dark:border-primary border-t-transparent" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {showReplies[comment._id] && comment.replies?.length > 0 && (
                  <div className="mt-3 ml-8 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="group">
                        <div className="flex space-x-2">
                          <ProfileImage
                            src={reply.author?.profilePicture}
                            alt={reply.author?.name || reply.author?.username || "User"}
                            size="small"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl px-3 py-2 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition duration-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                                    {reply.author?.name || reply.author?.username || "Unknown User"}
                                  </span>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-dark-text-muted">
                                    {formatTimestamp(reply.createdAt)}
                                  </span>
                                </div>
                                {reply.author?._id === user?._id && (
                                  <button
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                  >
                                    <FaTrash className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-700 dark:text-dark-text-secondary">{reply.content}</p>
                            </div>

                            {/* Reply Actions */}
                            <div className="flex items-center space-x-4 mt-1 ml-3">
                              <button
                                onClick={() => handleLikeComment(reply._id)}
                                className={`flex items-center space-x-1 text-xs cursor-pointer ${
                                  reply.likes?.includes(user?._id)
                                    ? 'text-red-500'
                                    : 'text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400'
                                } transition duration-200`}
                              >
                                {reply.likes?.includes(user?._id) ? (
                                  <FaHeart className="h-3 w-3" />
                                ) : (
                                  <FaRegHeart className="h-3 w-3" />
                                )}
                                <span>{reply.likes?.length || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserPostSection = ({ username, accountType, isOwnProfile }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [connections, setConnections] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showRepliesFor, setShowRepliesFor] = useState(new Set());
  const [showComments, setShowComments] = useState({});
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserPosts(username);
      
      // Ensure we have all the required data populated
      const formattedPosts = await Promise.all(data.map(async post => {
        // Fetch comments for each post
        const comments = await getCommentsByPostId(post._id);
        
        return {
          ...post,
          author: post.author && typeof post.author === 'object' 
            ? {
                ...post.author,
                name: post.author.name || post.author.username || 'Unknown User',
                username: post.author.username || 'user',
                profilePicture: post.author.profilePicture || null
              }
            : { _id: post.author, name: 'Unknown User', username: 'user', profilePicture: null },
          likes: post.likes || [],
          comments: comments || [] // Use the fetched comments
        };
      }));
      
      console.log("Formatted posts:", formattedPosts);
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      if (newPostImage) formData.append('image', newPostImage);

      const createdPost = await createPost(formData);
      setPosts([createdPost, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
      setShowPostForm(false);
      toast.success('Post created successfully');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleDelete = (postId) => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text-primary p-4 rounded-lg shadow-lg">
        <p className="mb-4">Are you sure you want to delete this post?</p>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-1.5 rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-hover"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600"
            onClick={async () => {
              try {
                await deletePost(postId);
                setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
                toast.success('Post deleted successfully');
                toast.dismiss(t.id);
              } catch (error) {
                toast.error('Failed to delete post');
                toast.dismiss(t.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleEditClick = (post) => {
    setEditingPostId(post._id);
    setEditContent(post.content);
    setEditImage(null);
  };

  const handleEditSubmit = async (postId) => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', editContent);
      if (editImage) formData.append('image', editImage);

      const updated = await updatePost(postId, formData);
      toast.success('Post updated successfully');
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updated : post))
      );
      setEditingPostId(null);
      setEditContent('');
      setEditImage(null);
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditImage(null);
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      const updatedPost = await likePost(postId);
      setPosts(prevPosts => 
        prevPosts.map(post => post._id === postId ? updatedPost : post)
      );
      toast.success('Post liked!');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (postId) => {
    try {
      setIsLoadingConnections(true);
      const connections = await connectionService.getConnections();
      setConnections(connections);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleShareToConnections = async (postId) => {
    try {
      setIsSharing(true);
      await Promise.all(selectedConnections.map(async (connectionId) => {
        await sharePost(postId, connectionId);
      }));
      
      setShowShareDialog(false);
      setSelectedConnections([]);
      toast.success(`Post shared with ${selectedConnections.length} connection${selectedConnections.length !== 1 ? 's' : ''}`);
      
      if (selectedConnections.length === 1) {
        const recipientId = selectedConnections[0];
        navigate(`/messages?user=${recipientId}`);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async (postId) => {
    try {
      const postUrl = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard');
      setShowShareDialog(false);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleAddComment = async (postId) => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const addedComment = await addComment(postId, newComment);
      
      // Update the posts state with the new comment
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), {
                ...addedComment,
                author: user,
                likes: [],
                replies: []
              }]
            };
          }
          return post;
        })
      );
      
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (postId, commentId) => {
    if (!user) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      const updatedComment = await likeComment(commentId);
      
      // Update the posts state with the updated comment
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => 
                comment._id === commentId ? { ...comment, likes: updatedComment.likes } : comment
              )
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleReply = async (commentId) => {
    if (!replyContent.trim()) return;
    try {
      await createReply(commentId, { content: replyContent });
      await fetchPosts(); // Refresh posts to get updated replies
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
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
                className="px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary"
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
        ), { duration: 5000 });
      });
    };

    const shouldDelete = await confirmDelete();
    if (!shouldDelete) return;

    try {
      await deleteReply(replyId);
      await fetchPosts(); // Refresh posts to get updated replies
      toast.success('Reply deleted successfully', { duration: 3000 });
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply', { duration: 3000 });
    }
  };

  // Memoize handlers to prevent re-renders
  const handleNewCommentChange = useCallback((e) => {
    setNewComment(e.target.value);
  }, []);

  const handleReplyContentChange = useCallback((e) => {
    setReplyContent(e.target.value);
  }, []);

  const toggleReplies = (commentId) => {
    setShowRepliesFor(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Memoize the comment input component
  const CommentInput = useMemo(() => (
    <div className="flex items-start space-x-2">
      <ProfileImage src={user.profilePicture} alt={user.name} size="medium" />
      <div className="flex-1">
        <input
          type="text"
          className="w-full border-b border-gray-300 py-1 px-2 focus:outline-none focus:border-blue-500"
          placeholder="Write a comment..."
          value={newComment}
          onChange={handleNewCommentChange}
          onKeyPress={(e) => e.key === 'Enter' && newComment.trim() && handleAddComment(e.target.dataset.postId)}
          data-post-id=""
        />
      </div>
    </div>
  ), [newComment, user.profilePicture, user.name, handleNewCommentChange, handleAddComment]);

  // Memoize the reply input component
  const ReplyInput = useMemo(() => (
    <div className="mt-2 flex items-start space-x-2">
      <ProfileImage src={user.profilePicture} alt={user.name} size="small" />
      <div className="flex-1">
        <input
          type="text"
          className="w-full border-b border-gray-300 py-1 px-2 focus:outline-none focus:border-blue-500 text-sm"
          placeholder="Write a reply..."
          value={replyContent}
          onChange={handleReplyContentChange}
          onKeyPress={(e) => e.key === 'Enter' && replyContent.trim() && handleReply(e.target.dataset.commentId)}
          data-comment-id=""
        />
      </div>
    </div>
  ), [replyContent, user.profilePicture, user.name, handleReplyContentChange, handleReply]);

  return (
    <div className="p-4 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Posts</h2>
        {isOwnProfile && user && !showPostForm && (
          <div 
            className="flex items-center space-x-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-md cursor-pointer transition"
            onClick={() => setShowPostForm(true)}
          >
            <Plus className="text-blue-600 dark:text-blue-400" size={16} />
            <p className="text-blue-600 dark:text-blue-400 text-sm">Add Post</p>
          </div>
        )}
      </div>
      
      {/* Post Creation Form */}
      {isOwnProfile && user && showPostForm && (
        <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow mb-4 border border-gray-200 dark:border-dark-border">
          <textarea
            className="w-full border border-gray-200 dark:border-dark-border rounded p-2 mb-3 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={3}
          />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <label className="cursor-pointer flex items-center text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary">
                <span className="mr-2">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPostImage(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {newPostImage && (
                <span className="ml-2 text-sm text-gray-500 dark:text-dark-text-muted">{newPostImage.name}</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowPostForm(false);
                  setNewPostContent('');
                  setNewPostImage(null);
                }}
                className="px-4 py-1.5 rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="px-4 py-1.5 rounded-md text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Posts List */}
      <div className="space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        )}
    
        {!loading && posts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">
            <p>No posts yet.</p>
            {isOwnProfile && user && (
              <p className="mt-2 text-sm">You don't have any posts. Share something!</p>
            )}
          </div>
        )}
  
        {posts.map((post) => (
          <div key={post._id} className="bg-white dark:bg-dark-card shadow rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            {/* Post Header */}
            <div className="flex items-center mb-2">
              <ProfileImage 
                src={post.author.profilePicture} 
                alt={post.author.name || post.author.username || "User"} 
                size="large" 
                className="mt-0.5"
              />
              <div className="ml-3">
                <p className="font-semibold text-gray-800 dark:text-dark-text-primary">{post.author.name || post.author.username || "Unknown User"}</p>
                <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                  {formatTimestamp(post.createdAt)}
                </p>
              </div>
              {post.author._id === user?._id && (
                <div className="ml-auto flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                  <button
                    onClick={() => handleEditClick(post)}
                    className="hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="hover:text-red-500 dark:hover:text-red-400"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>

            {/* Post Content */}
            {editingPostId === post._id ? (
              <div className="mt-2">
                <textarea
                  className="w-full border border-gray-200 dark:border-dark-border rounded p-2 mb-3 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-hover"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditSubmit(post._id)}
                    className="px-4 py-1.5 rounded-md text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-800 dark:text-dark-text-primary mb-3">{post.content}</p>
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full rounded-lg mb-3"
                  />
                )}
              </>
            )}

            {/* Post Actions */}
            <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => handleLike(post._id)}
                className={`flex items-center space-x-1 ${
                  post.likes?.includes(user?._id)
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400'
                }`}
                disabled={isLiking}
              >
                {post.likes?.includes(user?._id) ? <FaHeart /> : <FaRegHeart />}
                <span>{post.likes?.length || 0}</span>
              </button>
              <button
                onClick={() => setShowComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                className="flex items-center space-x-1 text-gray-500 dark:text-dark-text-muted hover:text-blue-500 dark:hover:text-blue-400"
              >
                <FaRegComment />
                <span>{post.comments?.length || 0}</span>
              </button>
              <button
                onClick={() => handleShare(post._id)}
                className="flex items-center space-x-1 text-gray-500 dark:text-dark-text-muted hover:text-green-500 dark:hover:text-green-400"
              >
                <FaShareAlt />
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post._id] && (
              <CommentSection
                post={post}
                user={user}
                onCommentAdded={() => fetchPosts()}
              />
            )}
          </div>
        ))}
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Share Post</h3>
            {isLoadingConnections ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-blue-400"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto">
                  {connections.map((connection) => (
                    <div
                      key={connection._id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedConnections(prev =>
                          prev.includes(connection._id)
                            ? prev.filter(id => id !== connection._id)
                            : [...prev, connection._id]
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedConnections.includes(connection._id)}
                        onChange={() => {}}
                        className="rounded text-blue-500 dark:text-blue-400"
                      />
                      <ProfileImage
                        src={connection.profilePicture}
                        alt={connection.name}
                        size="small"
                      />
                      <span className="text-gray-900 dark:text-dark-text-primary">{connection.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowShareDialog(false);
                      setSelectedConnections([]);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-hover rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleShareToConnections(posts[0]._id)}
                    disabled={selectedConnections.length === 0 || isSharing}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSharing ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPostSection;