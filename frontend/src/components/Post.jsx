import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MoreVertical, Trash2, Edit, MessageCircle, Share2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import postService from "../api/postService";

// LikeButton component for consistent like functionality
const LikeButton = ({ initialLikes = 0, initialLiked = false, size = 18, onLike }) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const { user } = useAuth();

  useEffect(() => {
    setLiked(initialLiked);
    setLikes(initialLikes);
  }, [initialLiked, initialLikes]);

  const toggleLike = async () => {
    if (!user?._id) {
      toast.error("Please login to like");
      return;
    }

    try {
      // Call API first
      if (onLike) {
        await onLike();
      }
      // Only update state after successful API call
      setLiked(!liked);
      setLikes(likes + (liked ? -1 : 1));
    } catch (error) {
      toast.error(error.message || "Failed to update like");
    }
  };

  return (
    <button
      onClick={toggleLike}
      className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-1 rounded-full transition-colors"
    >
      <ThumbsUp
        size={size}
        className={`transition-all ${
          liked ? "fill-blue-500 text-blue-500" : "text-gray-500 hover:text-blue-500"
        }`}
      />
      <span className={`text-sm font-medium ${liked ? "text-blue-500" : "text-gray-500"}`}>{likes}</span>
    </button>
  );
};

// Reply component - extracted to improve code organization and readability
const Reply = memo(({ 
  reply, 
  postId, 
  commentId, 
  onLikeReply, 
  onDeleteReply, 
  currentUserId 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Check if the current user is the author of this reply
  const isReplyAuthor = currentUserId === reply.author?._id;

  // Format the creation time
  const formattedTime = useMemo(() => 
    formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }),
    [reply.createdAt]
  );

  // Handler for confirming reply deletion
  const confirmDeleteReply = useCallback(() => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Delete Reply</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-600">Are you sure you want to delete this reply? This action cannot be undone.</p>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDeleteReply(postId, commentId, reply._id);
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  }, [postId, commentId, reply._id, onDeleteReply]);

  // Handler for liking a reply
  const handleLikeReply = useCallback(async () => {
    try {
      setIsLiking(true);
      await onLikeReply(postId, commentId, reply._id);
    } catch (error) {
      console.error("Error liking reply:", error);
      toast.error(error.message || "Failed to like reply");
    } finally {
      setIsLiking(false);
    }
  }, [postId, commentId, reply._id, onLikeReply]);

  return (
    <div className="flex items-start space-x-2">
      <Link to={`/profile/${reply.author.username}`} className="flex-shrink-0">
        <img
          src={reply.author.profilePicture || "/avatar.png"}
          alt={reply.author.name || "User"}
          className="w-6 h-6 mt-4 rounded-full object-cover"
        />
      </Link>
      <div className="flex-1">
        <div className="bg-white rounded-lg p-2 shadow-sm relative">
          <div className="flex justify-between items-start">
            <Link to={`/profile/${reply.author.username}`} className="font-medium text-gray-900 hover:underline">
              {reply.author.name || "Unknown User"}
            </Link>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">
                {formattedTime}
              </span>
              {isReplyAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical size={14} className="text-gray-500" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border">
                      <button
                        onClick={() => {
                          confirmDeleteReply();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2 text-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-gray-800 text-sm">{reply.content}</p>
        </div>
        <div className="flex items-center mt-1 space-x-4 text-xs">
          <LikeButton
            initialLikes={reply.likes || 0}
            initialLiked={reply.liked}
            size={12}
            onLike={handleLikeReply}
          />
        </div>
      </div>
    </div>
  );
});

// Comment component - Handles comments and their replies
const Comment = memo(({ 
  comment, 
  postId, 
  onUpdatePost, 
  currentUserId 
}) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Check if the current user is the author of this comment
  const isCommentAuthor = currentUserId === comment?.author?._id;

  // Format the creation time
  const formattedTime = useMemo(() => 
    formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }),
    [comment.createdAt]
  );

  // Handle liking a comment
  const handleLikeComment = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to like comments");
      return;
    }
    
    try {
      setIsLiking(true);
      
      // Make the API call
      const updatedPost = await postService.likeComment(postId, comment._id);
      
      // Update the post in the parent component
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error(error.message || "Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  }, [user, comment._id, postId, onUpdatePost]);

  // Handle replying to a comment
  const handleReply = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to reply to comments");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Call the API
      const updatedPost = await postService.replyToComment(postId, comment._id, replyContent.trim());
      
      // Reset the form
      setReplyContent('');
      setShowReplyInput(false);
      
      // Update the parent component
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
      
      // Show replies after adding one
      setShowReplies(true);
      
      toast.success("Reply added successfully!");
    } catch (error) {
      console.error("Error replying to comment:", error);
      toast.error(error.message || "Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, replyContent, postId, comment._id, onUpdatePost]);

  // Handle liking a reply
  const handleLikeReply = useCallback(async (postId, commentId, replyId) => {
    if (!user?._id) {
      toast.error("Please login to like replies");
      return;
    }
    
    try {
      // Call the API
      const updatedPost = await postService.likeReply(postId, commentId, replyId);
      
      // Update the parent component
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
    } catch (error) {
      console.error("Error liking reply:", error);
      toast.error(error.message || "Failed to like reply");
    }
  }, [user, onUpdatePost]);

  // Handle deleting a comment
  const handleDeleteComment = useCallback(async () => {
    try {
      // Optimistically update UI first
      setIsDeleted(true);
      
      const updatedPost = await postService.deleteComment(postId, comment._id);
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
      toast.success("Comment deleted successfully");
    } catch (error) {
      // Revert UI update if API call fails
      setIsDeleted(false);
      console.error("Error deleting comment:", error);
      toast.error(error.message || "Failed to delete comment");
    }
  }, [postId, comment._id, onUpdatePost]);

  // Handle deleting a reply
  const handleDeleteReply = useCallback(async (postId, commentId, replyId) => {
    try {
      const updatedPost = await postService.deleteReply(postId, commentId, replyId);
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      }
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error(error.message || "Failed to delete reply");
    }
  }, [onUpdatePost]);

  // Confirmation dialog for deleting a comment
  const confirmDeleteComment = useCallback(() => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Delete Comment</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-600">Are you sure you want to delete this comment? This action cannot be undone.</p>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleDeleteComment();
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  }, [handleDeleteComment]);

  // Toggle showing replies
  const toggleReplies = useCallback(() => {
    setShowReplies(prev => !prev);
  }, []);

  // If comment is deleted, don't render anything
  if (isDeleted) return null;
  if (!comment) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start space-x-2">
        <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0">
          <img
            src={comment.author.profilePicture || "/avatar.png"}
            alt={comment.author.name || "User"}
            className="w-8 h-8 my-4 rounded-full object-cover"
          />  
        </Link>
        <div className="flex-1">
          <div className="bg-white rounded-lg p-3 shadow-sm relative">
            <div className="flex justify-between items-start">
              <Link to={`/profile/${comment.author.username}`} className="font-medium text-gray-900 hover:underline">
                {comment.author.name || "Unknown User"}
              </Link>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">
                  {formattedTime}
                </span>
                {isCommentAuthor && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border">
                        <button
                          onClick={() => {
                            confirmDeleteComment();
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2 text-sm"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1 text-gray-800">{comment.content}</p>
          </div>
          <div className="flex items-center mt-2 space-x-4 text-xs">
            <LikeButton
              initialLikes={comment?.likes || 0}
              initialLiked={comment?.liked}
              size={14}
              onLike={handleLikeComment}
            />
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={toggleReplies}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
              >
                <span>{showReplies ? "Hide" : "Show"} {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}</span>
              </button>
            )}
          </div>
          
          {showReplyInput && (
            <div className="mt-3 flex items-center gap-2">
              <img
                src={user?.profilePicture || "/avatar.png"}
                alt={user?.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
              <input
                type="text"
                placeholder="Write a reply..."
                className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && replyContent.trim() && handleReply()}
              />
              <button
                onClick={handleReply}
                disabled={isSubmitting || !replyContent.trim()}
                className={`p-1 rounded-full flex-shrink-0 ${
                  isSubmitting || !replyContent.trim()
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
              >
                <Send size={14} />
              </button>
            </div>
          )}
          
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
              {comment.replies.map((reply) => (
                <Reply
                  key={reply._id}
                  reply={reply}
                  postId={postId}
                  commentId={comment._id}
                  onLikeReply={handleLikeReply}
                  onDeleteReply={handleDeleteReply}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Main Post component
const Post = memo(({ post, onLike, onComment, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [visibleComments, setVisibleComments] = useState(2);
  const [showComments, setShowComments] = useState(true);
  
  // Store comment visibility state in ref to persist across re-renders
  const commentStateRef = useRef({
    visibleComments: 2,
    showComments: true
  });

  // Update ref when state changes
  useEffect(() => {
    commentStateRef.current.visibleComments = visibleComments;
    commentStateRef.current.showComments = showComments;
  }, [visibleComments, showComments]);

  // Restore comment state when post updates, but NOT on like changes
  useEffect(() => {
    if (post._id) {
      setVisibleComments(commentStateRef.current.visibleComments);
      setShowComments(commentStateRef.current.showComments);
    }
  }, [post._id]); // Only run when post ID changes, indicating a new post

  // Initialize edited content when the post changes
  useEffect(() => {
    if (post) {
      setEditedContent(post.content || '');
    }
  }, [post]);

  // Check if the current user is the author
  const isAuthor = user?._id === post?.author?._id;

  // Format the creation time
  const formattedTime = useMemo(() => 
    formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
    [post.createdAt]
  );

  // Get safe comments array
  const safeComments = useMemo(() => {
    return Array.isArray(post.comments) ? post.comments : [];
  }, [post.comments]);

  // Validate post data
  if (!post || !post._id || !post.author) {
    return null;
  }

  // Handle adding a comment
  const handleComment = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to comment");
      return;
    }

    if (!commentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedPost = await onComment(post._id, commentContent.trim());
      setCommentContent("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, commentContent, post._id, onComment]);

  // Handle liking a post
  const handleLike = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to like posts");
      return;
    }
    
    try {
      setIsLiking(true);
      await onLike(post._id);
    } catch (error) {
      console.error("Error liking post:", error);
      if (error.message === 'Post not found' || error.response?.status === 404) {
        toast.error("This post no longer exists");
      } else {
        toast.error(error.message || "Failed to update like");
      }
    } finally {
      setIsLiking(false);
    }
  }, [user, post._id, onLike]);

  // Handle post updates from comments and replies
  const handlePostUpdate = useCallback((updatedPost) => {
    if (updatedPost && onUpdate) {
      onUpdate(post._id, updatedPost);
    }
  }, [post._id, onUpdate]);

  // Handle post deletion
  const handleDelete = useCallback(async () => {
    try {
      await onDelete(post._id);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Failed to delete post");
    }
  }, [post._id, onDelete]);

  // Confirmation dialog for deleting a post
  const confirmDelete = useCallback(() => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Delete Post</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleDelete();
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  }, [handleDelete]);

  // Handle post update
  const handleUpdate = useCallback(async () => {
    if (!editedContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      await onUpdate(post._id, editedContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(error.message || "Failed to update post");
    }
  }, [post._id, editedContent, onUpdate]);

  // Handle post sharing
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
  }, [post._id]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        {/* Post header with author info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link to={`/profile/${post.author.username}`} className="flex items-center">
              <img
                src={post.author.profilePicture || "/avatar.png"}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900 hover:underline">
                  {post.author.name}
                </h3>
                <p className="text-gray-500 text-sm">{post.author.headline}</p>
                <p className="text-gray-400 text-xs">{formattedTime}</p>
              </div>
            </Link>
          </div>
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreVertical size={20} className="text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      confirmDelete();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post content - either display or edit mode */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content || 'No content available'}</p>
        )}

        {/* Post image if available */}
        {post.image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={post.image}
              alt="Post content"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* Post actions (like, comment, share) */}
        <div className="flex items-center justify-between border-t border-b border-gray-200 py-3">
          <div className="flex items-center gap-6">
            <LikeButton
              initialLikes={post.likes || 0}
              initialLiked={post.liked}
              size={18}
              onLike={handleLike}
            />
            <button
              className="flex items-center gap-2 px-3 py-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-50 transition-colors"
              onClick={() => {
                if (showComments) {
                  document.getElementById(`comment-input-${post._id}`).focus();
                } else {
                  setShowComments(true);
                }
              }}
            >
              <MessageCircle size={18} />
              <span className="font-medium">{post.comments?.length || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-50 transition-colors"
            >
              <Share2 size={18} />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Comments section */}
        {safeComments.length > 0 && (
          <div className="mt-4 space-y-4 px-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 text-sm"
            >
              <span>{showComments ? "Hide" : "Show"} {safeComments.length === 1 ? "comment" : "comments"}</span>
            </button>
            
            {showComments && (
              <div className="space-y-4">
                {safeComments.slice(0, visibleComments).map((comment) => (
                  <Comment
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    onUpdatePost={handlePostUpdate}
                    currentUserId={user?._id}
                  />
                ))}
                
                {safeComments.length > visibleComments && (
                  <button
                    onClick={() => setVisibleComments(prev => 
                      prev === safeComments.length ? 2 : safeComments.length
                    )}
                    className="text-gray-500 hover:text-blue-500 text-sm"
                  >
                    {visibleComments === safeComments.length 
                      ? "Show less comments" 
                      : `View ${safeComments.length - visibleComments} more comments`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add comment section */}
        {showComments && (
          <div className="mt-4 px-4 pb-4">
            <div className="flex items-center gap-2">
              <img
                src={user?.profilePicture || "/avatar.png"}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex flex-1 items-center">
                <input
                  id={`comment-input-${post._id}`}
                  type="text"
                  placeholder="Write a comment..."
                  className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && commentContent.trim() && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={isSubmitting || !commentContent.trim()}
                  className={`ml-2 p-2 rounded-full ${
                    isSubmitting || !commentContent.trim()
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  const prevPost = prevProps.post;
  const nextPost = nextProps.post;
  
  if (prevPost._id !== nextPost._id) return false;
  if (prevPost.content !== nextPost.content) return false;
  if (prevPost.comments?.length !== nextPost.comments?.length) return false;
  if (JSON.stringify(prevPost.author) !== JSON.stringify(nextPost.author)) return false;
  if (prevPost.image !== nextPost.image) return false;
  
  // For comments, compare their content, structure, and replies
  const areCommentsEqual = prevPost.comments?.every((prevComment, index) => {
    const nextComment = nextPost.comments[index];
    if (!nextComment) return false;

    // Compare basic comment properties
    if (prevComment._id !== nextComment._id ||
        prevComment.content !== nextComment.content ||
        JSON.stringify(prevComment.author) !== JSON.stringify(nextComment.author)) {
      return false;
    }

    // Compare replies
    const prevReplies = prevComment.replies || [];
    const nextReplies = nextComment.replies || [];
    
    if (prevReplies.length !== nextReplies.length) return false;

    return prevReplies.every((prevReply, replyIndex) => {
      const nextReply = nextReplies[replyIndex];
      return prevReply._id === nextReply._id &&
             prevReply.content === nextReply.content &&
             JSON.stringify(prevReply.author) === JSON.stringify(nextReply.author);
    });
  });
  
  if (!areCommentsEqual) return false;
  
  // If we got here, only likes might have changed, so preserve the component's state
  return true;
});

Comment.propTypes = {
  comment: PropTypes.object.isRequired,
  postId: PropTypes.string.isRequired,
  onUpdatePost: PropTypes.func.isRequired,
  currentUserId: PropTypes.string
};

Reply.propTypes = {
  reply: PropTypes.object.isRequired,
  postId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
  onLikeReply: PropTypes.func.isRequired,
  onDeleteReply: PropTypes.func.isRequired,
  currentUserId: PropTypes.string
};

Post.propTypes = {
  post: PropTypes.object.isRequired,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

LikeButton.propTypes = {
  initialLikes: PropTypes.number,
  initialLiked: PropTypes.bool,
  size: PropTypes.number,
  onLike: PropTypes.func
};

export default Post; 