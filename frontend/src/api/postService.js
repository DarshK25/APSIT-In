import axiosInstance from './axiosConfig';

class PostService {
  async getAllPosts() {
    try {
      const response = await axiosInstance.get('/posts');
      return response.data.posts || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  }

  async createPost(formData) {
    try {
      const response = await axiosInstance.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  }

  async likePost(postId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like`);
      return response.data.post;
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error(error.response?.data?.message || 'Failed to like post');
    }
  }

  async unlikePost(postId) {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}/like`);
      return response.data.post;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw new Error(error.response?.data?.message || 'Failed to unlike post');
    }
  }

  async addComment(postId, content) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments`, { content });
      return response.data.post;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  async updateComment(postId, commentId, content) {
    try {
      const response = await axiosInstance.put(`/posts/${postId}/comments/${commentId}`, { content });
      return response.data.post;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to update comment');
    }
  }

  async deleteComment(postId, commentId) {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}/comments/${commentId}`);
      return response.data.post;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete comment');
    }
  }

  async likeComment(postId, commentId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/like`);
      return response.data.post;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to like comment');
    }
  }

  async replyToComment(postId, commentId, content) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/replies`, { content });
      return response.data.post;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to reply to comment');
    }
  }

  async deletePost(postId) {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}`);
      if (response.data.success) {
        return { success: true, deletedPostId: response.data.deletedPostId };
      } else {
        throw new Error(response.data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  }

  async updatePost(postId, formData) {
    try {
      // If formData is not a FormData object, create one
      let data = formData;
      if (!(formData instanceof FormData)) {
        data = new FormData();
        if (formData.content !== undefined) {
          data.append('content', formData.content);
        }
        if (formData.image) {
          data.append('image', formData.image);
        }
        if (formData.removeImage !== undefined) {
          data.append('removeImage', formData.removeImage);
        }
      }

      const response = await axiosInstance.put(`/posts/${postId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.post;
      } else {
        throw new Error(response.data.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to update post');
    }
  }

  async getUserPosts(username) {
    try {
      const response = await axiosInstance.get(`/posts/user/${username}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }
}

export default new PostService(); 