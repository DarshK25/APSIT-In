import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MoreVertical, Trash2, Edit, MessageCircle, Share2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import postService from "../api/postService";

const Comment = memo(({ comment, postId, onUpdate }) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReplyMenu, setShowReplyMenu] = useState(null);

  // Transform the comment to ensure it has all required properties
  const transformedComment = useMemo(() => {
    if (!comment) return null;
    
    return {
    ...comment,
    _id: comment._id,
      content: comment.content || 'No content available',
      createdAt: comment.createdAt || new Date().toISOString(),
      author: comment.author && typeof comment.author === 'object' ? {
        _id: comment.author._id,
        username: comment.author.username || 'unknown',
        name: comment.author.name || 'Unknown User',
        profilePicture: comment.author.profilePicture || '/avatar.png'
      } : {
        _id: 'unknown',
      username: 'unknown',
      name: 'Unknown User',
      profilePicture: '/avatar.png'
    },
    likes: typeof comment.likes === 'number' ? comment.likes : 0,
    liked: Boolean(comment.liked),
      replies: Array.isArray(comment.replies) ? comment.replies : []
    };
  }, [comment]);

  const isCommentAuthor = user?._id === transformedComment?.author?._id;

  const handleLikeComment = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to like comments");
      return;
    }
    
    try {
      setIsLiking(true);
      // Create a temporary optimistic update
      const originalComment = { ...transformedComment };
      const newLikedState = !transformedComment.liked;
      const newLikesCount = transformedComment.liked ? transformedComment.likes - 1 : transformedComment.likes + 1;
      
      // Call the API
      const updatedPost = await postService.likeComment(postId, transformedComment._id);
      
      // Update the parent component with the new post data
      if (onUpdate) onUpdate(updatedPost);
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error(error.message || "Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  }, [user, transformedComment, postId, onUpdate]);

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
      const updatedPost = await postService.replyToComment(postId, transformedComment._id, replyContent.trim());
      
      // Reset the form
      setReplyContent('');
      setShowReplyInput(false);
      
      // Update the parent component with the new post data
      if (onUpdate) onUpdate(updatedPost);
      
      toast.success("Reply added successfully!");
    } catch (error) {
      console.error("Error replying to comment:", error);
      toast.error(error.message || "Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, replyContent, postId, transformedComment._id, onUpdate]);

  const toggleReplies = useCallback(() => {
    setShowReplies(prev => !prev);
  }, []);

  const handleDeleteComment = useCallback(async () => {
    try {
      const updatedPost = await postService.deleteComment(postId, transformedComment._id);
      if (onUpdate) onUpdate(updatedPost);
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(error.message || "Failed to delete comment");
    }
  }, [postId, transformedComment._id, onUpdate]);

  const handleDeleteReply = useCallback(async (replyId) => {
    try {
      const updatedPost = await postService.deleteReply(postId, transformedComment._id, replyId);
      if (onUpdate) onUpdate(updatedPost);
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error(error.message || "Failed to delete reply");
    }
  }, [postId, transformedComment._id, onUpdate]);

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

  const confirmDeleteReply = useCallback((replyId) => {
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
              handleDeleteReply(replyId);
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
  }, [handleDeleteReply]);

  const handleLikeReply = useCallback(async (replyId) => {
    if (!user?._id) {
      toast.error("Please login to like replies");
      return;
    }
    
    try {
      // Call the API
      const updatedPost = await postService.likeReply(postId, transformedComment._id, replyId);
      
      // Update the parent component with the new post data
      if (onUpdate) onUpdate(updatedPost);
    } catch (error) {
      console.error("Error liking reply:", error);
      toast.error(error.message || "Failed to like reply");
    }
  }, [user, transformedComment, postId, onUpdate]);

  if (!transformedComment) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start space-x-2">
        <Link to={`/profile/${transformedComment.author.username}`} className="flex-shrink-0">
          <img
            src={transformedComment.author.profilePicture || "/avatar.png"}
            alt={transformedComment.author.name || "User"}
            className="w-8 h-8 my-4 rounded-full object-cover"
          />  
        </Link>
        <div className="flex-1">
          <div className="bg-white rounded-lg p-3 shadow-sm relative">
            <div className="flex justify-between items-start">
              <Link to={`/profile/${transformedComment.author.username}`} className="font-medium text-gray-900 hover:underline">
                {transformedComment.author.name || "Unknown User"}
            </Link>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">
              {formatDistanceToNow(new Date(transformedComment.createdAt), { addSuffix: true })}
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
            <p className="mt-1 text-gray-800">{transformedComment.content}</p>
          </div>
          <div className="flex items-center mt-2 space-x-4 text-xs">
            <button
              onClick={handleLikeComment}
              disabled={isLiking}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                transformedComment.liked ? "text-blue-500 bg-blue-50" : "text-gray-500 hover:text-blue-500 hover:bg-blue-50"
              }`}
            >
              <ThumbsUp size={14} className={`transition-colors ${transformedComment.liked ? "fill-current text-blue-500" : ""}`} />
              <span>{transformedComment.likes || 0} Likes</span>
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
            {transformedComment.replies && transformedComment.replies.length > 0 && (
              <button
                onClick={toggleReplies}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
              >
                <span>{showReplies ? "Hide" : "Show"} {transformedComment.replies.length} {transformedComment.replies.length === 1 ? "reply" : "replies"}</span>
              </button>
            )}
          </div>
          
          {showReplyInput && (
            <div className="mt-3 flex items-center gap-2">
              <img
                src={user?.profilePicture || "/avatar.png"}
                alt={user?.name}
                className="w-6 h-6 mt-4 rounded-full object-cover flex-shrink-0"
              />
              <input
                type="text"
                placeholder="Write a reply..."
                className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleReply()}
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
          
          {showReplies && transformedComment.replies && transformedComment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
              {transformedComment.replies.map((reply) => {
                const isReplyAuthor = user?._id === reply.author?._id;
                return (
                  <div key={reply._id} className="flex items-start space-x-2">
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
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                            {isReplyAuthor && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowReplyMenu(showReplyMenu === reply._id ? null : reply._id)}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <MoreVertical size={14} className="text-gray-500" />
                                </button>
                                {showReplyMenu === reply._id && (
                                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border">
                                    <button
                                      onClick={() => {
                                        confirmDeleteReply(reply._id);
                                        setShowReplyMenu(null);
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
                        <button
                          onClick={() => handleLikeReply(reply._id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                            reply.liked ? "text-blue-500 bg-blue-50" : "text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                          }`}
                        >
                          <ThumbsUp size={12} className={`transition-colors ${reply.liked ? "fill-current text-blue-500" : ""}`} />
                          <span>{reply.likes || 0} Likes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const Post = memo(({ post, onLike, onComment, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post?.content || '');
  const [showMenu, setShowMenu] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const [commentContent, setCommentContent] = useState('');
  const [visibleComments, setVisibleComments] = useState(2);
  const [showComments, setShowComments] = useState(true);

  // Initialize the edited content when the post changes
  useEffect(() => {
    if (post) {
      setCurrentPost(post);
      setEditedContent(post.content || '');
    }
  }, [post]);

  const isAuthor = user?._id === currentPost?.author?._id;

  // Get safe comments array
  const safeComments = useMemo(() => {
    return Array.isArray(currentPost.comments) ? currentPost.comments : [];
  }, [currentPost.comments]);

  if (!currentPost || !currentPost._id || !currentPost.author) {
    return null;
  }

  // Use useCallback for handlers to prevent unnecessary function recreations
  const handleComment = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedPost = await onComment(currentPost._id, comment.trim());
      setComment("");
      // Update the local post state with the new data
      if (updatedPost) {
        setCurrentPost(updatedPost);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, comment, currentPost._id, onComment]);

  const handleLike = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to like posts");
      return;
    }
    
    try {
      setIsLiking(true);
      const updatedPost = await onLike(currentPost._id);
      // Update the local post state with the new data
      if (updatedPost) {
        setCurrentPost(updatedPost);
      }
    } catch (error) {
      console.error("Error liking post:", error);
      if (error.message === 'Post not found' || error.response?.status === 404) {
        toast.error("This post no longer exists");
        // The post will be removed from the feed by the parent component
      } else {
        toast.error(error.message || "Failed to update like");
      }
    } finally {
      setIsLiking(false);
    }
  }, [user, currentPost._id, onLike]);

  // Handle comment update from child components
  const handleCommentUpdate = useCallback((updatedPost) => {
    if (updatedPost) {
      setCurrentPost(updatedPost);
      // Also notify the parent component
      if (onUpdate) {
        onUpdate(currentPost._id, updatedPost);
      }
    }
  }, [currentPost._id, onUpdate]);

  const handleDelete = useCallback(async () => {
    try {
      await onDelete(currentPost._id);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Failed to delete post");
    }
  }, [currentPost._id, onDelete]);

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

  const handleUpdate = useCallback(async () => {
    if (!editedContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      await onUpdate(currentPost._id, editedContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(error.message || "Failed to update post");
    }
  }, [currentPost._id, editedContent, onUpdate]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/post/${currentPost._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
  }, [currentPost._id]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link to={`/profile/${currentPost.author.username}`} className="flex items-center">
              <img
                src={currentPost.author.profilePicture || "/avatar.png"}
                alt={currentPost.author.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900 hover:underline">
                  {currentPost.author.name}
                </h3>
                <p className="text-gray-500 text-sm">{currentPost.author.headline}</p>
                <p className="text-gray-400 text-xs">
                  {formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true })}
                </p>
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
          <p className="text-gray-800 whitespace-pre-wrap mb-4">{currentPost.content || 'No content available'}</p>
        )}

        {currentPost.image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={currentPost.image}
              alt="Post content"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-b border-gray-200 py-3">
          <div className="flex items-center gap-6">
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                isLiking ? 'opacity-50 cursor-not-allowed' : 
                currentPost.liked ? "text-blue-500 bg-blue-50" : "text-gray-500 hover:text-blue-500 hover:bg-gray-50"
              }`}
              onClick={handleLike}
              disabled={isLiking || !user?._id}
            >
              <ThumbsUp size={18} className={`transition-colors ${currentPost.liked ? "fill-current text-blue-500" : ""}`} />
              <span className="font-medium">{currentPost.likes || 0}</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-50 transition-colors"
              onClick={() => {
                if (showComments) {
                  document.getElementById(`comment-input-${currentPost._id}`).focus();
                } else {
                  setShowComments(true);
                }
              }}
            >
              <MessageCircle size={18} />
              <span className="font-medium">{currentPost.comments?.length || 0}</span>
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
                    postId={currentPost._id}
                    onUpdate={handleCommentUpdate}
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

        {showComments && (
          <div className="mt-4 px-4 pb-4">
            <div className="flex items-center gap-2">
              <img
                src={user?.profilePicture || "/avatar.png"}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <input
                id={`comment-input-${currentPost._id}`}
                type="text"
                placeholder="Write a comment..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={isSubmitting || !comment.trim()}
                className={`p-2 rounded-full ${
                  isSubmitting || !comment.trim()
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Comment.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string,
    content: PropTypes.string,
    createdAt: PropTypes.string,
    author: PropTypes.shape({
      username: PropTypes.string,
      name: PropTypes.string,
      profilePicture: PropTypes.string,
    }),
    likes: PropTypes.number,
    liked: PropTypes.bool,
    replies: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        content: PropTypes.string,
        createdAt: PropTypes.string,
        author: PropTypes.shape({
          username: PropTypes.string,
          name: PropTypes.string,
          profilePicture: PropTypes.string,
        }),
        likes: PropTypes.number,
        liked: PropTypes.bool,
      })
    ),
  }).isRequired,
  postId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
};

Post.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string,
    image: PropTypes.string,
    likes: PropTypes.number,
    liked: PropTypes.bool,
    createdAt: PropTypes.string.isRequired,
    author: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      profilePicture: PropTypes.string,
      headline: PropTypes.string,
    }).isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        content: PropTypes.string,
        createdAt: PropTypes.string,
        author: PropTypes.shape({
          username: PropTypes.string,
          name: PropTypes.string,
          profilePicture: PropTypes.string,
        }),
        likes: PropTypes.number,
        liked: PropTypes.bool,
        replies: PropTypes.arrayOf(
          PropTypes.shape({
            _id: PropTypes.string,
            content: PropTypes.string,
            createdAt: PropTypes.string,
            author: PropTypes.shape({
              username: PropTypes.string,
              name: PropTypes.string,
              profilePicture: PropTypes.string,
            }),
            likes: PropTypes.number,
            liked: PropTypes.bool,
          })
        ),
      })
    ),
  }).isRequired,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default Post; 