import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp } from 'lucide-react';

const Post = ({ post, onLike, onComment }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center mb-2">
        <Link to={`/profile/${post.author.username}`}>
          <img
            src={post.author.profilePicture || "/avatar.png"}
            alt={post.author.name}
            className="w-10 h-10 rounded-full mr-2 object-cover"
          />
        </Link>
        <div>
          <Link
            to={`/profile/${post.author.username}`}
            className="font-semibold hover:underline"
          >
            {post.author.name}
          </Link>
          <p className="text-gray-500 text-sm">{post.author.headline}</p>
          <p className="text-gray-400 text-xs">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
      {post.image && (
        <div className="mb-4">
          <img
            src={post.image}
            alt="Post content"
            className="max-w-full h-auto rounded"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-center">
        <button
          className={`mr-4 flex items-center gap-1 ${
            isLiking ? 'opacity-50 cursor-not-allowed' : 
            post.liked ? "text-blue-500" : "text-gray-500 hover:text-blue-500"
          }`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <ThumbsUp size={18} className={post.liked ? "fill-current" : ""} />
          <span>{post.likes}</span>
        </button>
      </div>
      <div className="mt-4">
        <textarea
          placeholder="Write a comment..."
          className="w-full border rounded p-2 resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          rows={1}
          maxLength={500}
        />
        <button
          className={`bg-blue-500 text-white py-1 px-4 rounded mt-2 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          onClick={handleComment}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Commenting..." : "Comment"}
        </button>
        {post.comments.map((comment, index) => (
          <div key={comment._id || index} className="mt-2 p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              <Link to={`/profile/${comment.author.username}`}>
                <img
                  src={comment.author.profilePicture || "/avatar.png"}
                  alt={comment.author.name}
                  className="w-6 h-6 rounded-full mr-2 object-cover"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/profile/${comment.author.username}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {comment.author.name}
                  </Link>
                  <span className="text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Post.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    image: PropTypes.string,
    likes: PropTypes.number.isRequired,
    liked: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
    author: PropTypes.shape({
      username: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      profilePicture: PropTypes.string,
      headline: PropTypes.string,
    }).isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        author: PropTypes.shape({
          username: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          profilePicture: PropTypes.string,
        }).isRequired,
      })
    ).isRequired,
  }).isRequired,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
};

export default Post; 