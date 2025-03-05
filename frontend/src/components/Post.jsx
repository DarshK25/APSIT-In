import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MoreVertical, Trash2, Edit, MessageCircle, Share2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import postService from "../api/postService";

const Comment = ({ comment, postId, onUpdate }) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!comment || typeof comment !== 'object') {
    console.error("Invalid comment data: comment is null or not an object", comment);
    return null;
  }

  if (!comment._id || !comment.content || !comment.author) {
    console.error("Invalid comment data: missing required fields", {
      hasId: Boolean(comment._id),
      hasContent: Boolean(comment.content),
      hasAuthor: Boolean(comment.author)
    });
    return null;
  }

  if (!comment.author.username || !comment.author.name) {
    console.error("Invalid comment data: missing author fields", comment.author);
    return null;
  }

  const handleLikeComment = async () => {
    if (!user?._id) return;
    
    try {
      setIsLiking(true);
      await postService.likeComment(postId, comment._id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !user?._id) return;

    try {
      setIsSubmitting(true);
      await postService.replyToComment(postId, comment._id, replyContent.trim());
      setReplyContent('');
      setShowReplyInput(false);
      if (onUpdate) onUpdate();
      toast.success("Reply added successfully!");
    } catch (error) {
      console.error("Error replying to comment:", error);
      toast.error("Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <Link to={`/profile/${comment.author.username}`}>
          <img
            src={comment.author.profilePicture || "/avatar.png"}
            alt={comment.author.name || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link
              to={`/profile/${comment.author.username}`}
              className="font-semibold text-sm hover:underline"
            >
              {comment.author.name || comment.author.username}
            </Link>
            <span className="text-gray-400 text-xs">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLikeComment}
              disabled={isLiking || !user?._id}
              className={`text-xs flex items-center gap-1 ${
                comment.liked
                  ? "text-blue-500"
                  : "text-gray-500 hover:text-blue-500"
              }`}
            >
              <ThumbsUp size={14} className={comment.liked ? "fill-current" : ""} />
              <span>{comment.likes || 0}</span>
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              disabled={!user?._id}
              className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1"
            >
              <MessageCircle size={14} />
              Reply
            </button>
          </div>
          {showReplyInput && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 text-sm border rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleReply}
                disabled={isSubmitting || !replyContent.trim()}
                className="text-blue-500 hover:text-blue-600 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <Comment 
              key={reply._id || `${comment._id}-reply-${reply.createdAt}`} 
              comment={reply} 
              postId={postId} 
              onUpdate={onUpdate} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Post = ({ post, onLike, onComment, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post?.content || '');
  const [showMenu, setShowMenu] = useState(false);

  const isAuthor = user?._id === post?.author?._id;

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      await onComment(post._id, comment.trim());
      setComment("");
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error?.response?.data?.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      setIsLiking(true);
      await onLike(post._id);
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error(error?.response?.data?.message || "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(post._id);
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error?.response?.data?.message || "Failed to delete post");
    }
  };

  const confirmDelete = () => {
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
  };

  const handleUpdate = async () => {
    if (!editedContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      await onUpdate(post._id, editedContent.trim());
      setIsEditing(false);
      toast.success("Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(error?.response?.data?.message || "Failed to update post");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Post link copied to clipboard!");
  };

  if (!post) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
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
          <p className="text-gray-400 text-xs">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
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
          <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
        )}

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

        <div className="flex items-center justify-between border-t border-b border-gray-200 py-3">
          <div className="flex items-center gap-6">
        <button
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
            isLiking ? 'opacity-50 cursor-not-allowed' : 
                post.liked ? "text-blue-500 bg-blue-50" : "text-gray-500 hover:text-blue-500 hover:bg-gray-50"
          }`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <ThumbsUp size={18} className={post.liked ? "fill-current" : ""} />
              <span className="font-medium">{post.likes || 0}</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-50 transition-colors"
              onClick={() => document.getElementById(`comment-input-${post._id}`).focus()}
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

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <img
              src={user?.profilePicture || "/avatar.png"}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <input
              id={`comment-input-${post._id}`}
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

          {post.comments?.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              postId={post._id}
              onUpdate={() => onUpdate(post._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    author: PropTypes.shape({
      username: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      profilePicture: PropTypes.string,
    }).isRequired,
    likes: PropTypes.arrayOf(PropTypes.string),
    replies: PropTypes.array,
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
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        author: PropTypes.shape({
          username: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          profilePicture: PropTypes.string,
        }).isRequired,
        likes: PropTypes.arrayOf(PropTypes.string),
        replies: PropTypes.array,
      })
    ).isRequired,
  }),
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onUpdate: PropTypes.func,
};

export default Post; 