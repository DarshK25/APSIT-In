import axiosInstance from './axiosConfig';

class PostService {
  async getAllPosts() {
    try {
      const response = await axiosInstance.get('/posts');
      return response.data.newPost;
    } catch (error) {
      throw error;
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
      throw error;
    }
  }

  async likePost(postId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like`);
      return {
        likes: response.data.post.likes.length,
        liked: response.data.liked
      };
    } catch (error) {
      throw error;
    }
  }

  async unlikePost(postId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like`);
      return {
        likes: response.data.post.likes.length,
        liked: response.data.liked
      };
    } catch (error) {
      throw error;
    }
  }

  async addComment(postId, content) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments`, { content });
      return response.data.post;
    } catch (error) {
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      await axiosInstance.delete(`/posts/${postId}`);
    } catch (error) {
      throw error;
    }
  }

  async getUserPosts(username) {
    const response = await axiosInstance.get(`/posts/user/${username}`);
    return response.data;
  }
}

export default new PostService(); 