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

      const updatedPost = post.liked
        ? await postService.unlikePost(postId)
        : await postService.likePost(postId);

      // Update with actual server response
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? updatedPost : p
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

  const handleDelete = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  };

  const handleUpdate = async (postId, content) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      const updatedPost = await postService.updatePost(postId, formData);
      setPosts(prevPosts =>
        prevPosts.map(p => p._id === postId ? updatedPost : p)
      );
      return updatedPost;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  };

  // Transform posts to ensure proper data structure
  const transformedPosts = posts.map(post => ({
    ...post,
    comments: Array.isArray(post.comments) ? post.comments.map(comment => ({
      ...comment,
      likes: typeof comment.likes === 'number' ? comment.likes : 0,
      liked: Boolean(comment.liked),
      replies: Array.isArray(comment.replies) ? comment.replies.map(reply => ({
        ...reply,
        likes: typeof reply.likes === 'number' ? reply.likes : 0,
        liked: Boolean(reply.liked)
      })) : []
    })) : []
  }));

  return (
    <div className="space-y-4">
      <CreatePost onPost={handlePost} />
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : transformedPosts.length > 0 ? (
        transformedPosts.map((post) => (
          <Post
            key={post._id}
            post={post}
            onLike={handleLikeToggle}
            onComment={handleComment}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
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
          likes: PropTypes.number,
          liked: PropTypes.bool,
          replies: PropTypes.arrayOf(
            PropTypes.shape({
              _id: PropTypes.string.isRequired,
              content: PropTypes.string.isRequired,
              createdAt: PropTypes.string.isRequired,
              author: PropTypes.shape({
                username: PropTypes.string.isRequired,
                name: PropTypes.string.isRequired,
                profilePicture: PropTypes.string,
              }).isRequired,
              likes: PropTypes.number,
              liked: PropTypes.bool,
            })
          ),
        })
      ),
    })
  ).isRequired,
  setPosts: PropTypes.func.isRequired,
};

export default Feed; 