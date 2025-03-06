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
      toast.success("Post created successfully!");
      return createdPost;
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async (postId) => {
    const post = posts.find(p => p._id === postId);
    if (!post) {
      toast.error("Post not found");
      return;
    }

    // Store the original post state for rollback
    const originalPost = { ...post };

    try {
      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId
            ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked }
            : p
        )
      );

      // Make API call
      const updatedPost = await postService.likePost(postId);

      // Update with server response
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? updatedPost : p
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback on error
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p._id === postId ? originalPost : p
        )
      );
      
      // Handle specific error cases
      if (error.message === 'Post not found' || error.response?.status === 404) {
        toast.error("This post no longer exists");
        // Remove the post from the list since it's been deleted
        setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
      } else {
        toast.error(error.message || "Failed to update like");
      }
    }
  };

  const handleComment = async (postId, comment) => {
    try {
      const updatedPost = await postService.addComment(postId, comment);
      setPosts(prevPosts =>
        prevPosts.map(p => p._id === postId ? updatedPost : p)
      );
      toast.success("Comment added successfully!");
      return updatedPost;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
      throw error;
    }
  };

  const handleDelete = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Failed to delete post");
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
      toast.success("Post updated successfully!");
      return updatedPost;
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(error.message || "Failed to update post");
      throw error;
    }
  };

  // Transform posts to ensure proper data structure
  const transformedPosts = posts?.map(post => {
    if (!post || !post._id || !post.author) {
      console.error("Invalid post data:", post);
      return null;
    }
    return {
      ...post,
      likes: typeof post.likes === 'number' ? post.likes : 0,
      liked: Boolean(post.liked),
      comments: Array.isArray(post.comments) ? post.comments.map(comment => ({
        ...comment,
        _id: comment?._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: comment?.content || 'No content available',
        createdAt: comment?.createdAt || new Date().toISOString(),
        author: comment?.author || {
          username: 'unknown',
          name: 'Unknown User',
          profilePicture: '/avatar.png'
        },
        likes: typeof comment?.likes === 'number' ? comment.likes : 0,
        liked: Boolean(comment?.liked),
        replies: Array.isArray(comment?.replies) ? comment.replies.map(reply => ({
          ...reply,
          _id: reply?._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: reply?.content || 'No content available',
          createdAt: reply?.createdAt || new Date().toISOString(),
          author: reply?.author || {
            username: 'unknown',
            name: 'Unknown User',
            profilePicture: '/avatar.png'
          },
          likes: typeof reply?.likes === 'number' ? reply.likes : 0,
          liked: Boolean(reply?.liked)
        })) : []
      })) : []
    };
  }).filter(Boolean) || [];

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
        })
      ),
    })
  ).isRequired,
  setPosts: PropTypes.func.isRequired,
};

export default Feed; 