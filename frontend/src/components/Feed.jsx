import { useState } from "react";
import PropTypes from 'prop-types';
import Post from "./Post";
import CreatePost from "./CreatePost";
import { toast } from "react-hot-toast";
import postService from "../api/postService";

const Feed = ({ posts, setPosts }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePost = async (formData) => {
    try {
      setIsLoading(true);
      const createdPost = await postService.createPost(formData);
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      return createdPost;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async (postId) => {
    try {
      const post = posts.find(p => p._id === postId);
      if (!post) {
        toast.error("Post not found");
        return;
      }

      // Optimistically update the UI
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId
            ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked }
            : p
        )
      );

      const updatedLikeStatus = post.liked
        ? await postService.unlikePost(postId)
        : await postService.likePost(postId);

      // Update with actual server response
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId
            ? { ...p, likes: updatedLikeStatus.likes, liked: updatedLikeStatus.liked }
            : p
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId
            ? { ...p, likes: p.likes + (p.liked ? 1 : -1), liked: !p.liked }
            : p
        )
      );
      throw error;
    }
  };

  const handleComment = async (postId, comment) => {
    try {
      const updatedPost = await postService.addComment(postId, comment);
      setPosts(prevPosts =>
        prevPosts.map(p => p._id === postId ? updatedPost : p)
      );
      return updatedPost;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <CreatePost onPost={handlePost} />
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            onLike={handleLikeToggle}
            onComment={handleComment}
          />
        ))
      ) : (
        <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  );
};

Feed.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
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
      comments: PropTypes.array.isRequired,
    })
  ).isRequired,
  setPosts: PropTypes.func.isRequired,
};

export default Feed; 