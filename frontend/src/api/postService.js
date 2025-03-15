import axiosInstance from './axiosConfig';
import axios from 'axios';

// Simple in-memory cache for API responses
const cache = {
  posts: new Map(),
  postDetails: new Map(),
};

// Cache TTL in milliseconds (5 seconds)
const CACHE_TTL = 5000;

class PostService {
  constructor() {
    // Create a map to store cancellation tokens
    this.cancelTokens = new Map();
  }

  // Helper method to get cached data if available
  _getCachedData(cacheKey, cacheStore) {
    const cachedData = cacheStore.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
    return null;
  }

  // Helper method to set cache data
  _setCacheData(cacheKey, cacheStore, data) {
    cacheStore.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Helper method to cancel previous requests
  _cancelPreviousRequest(requestKey) {
    if (this.cancelTokens.has(requestKey)) {
      try {
        const source = this.cancelTokens.get(requestKey);
        source.cancel('Operation canceled due to new request');
      } catch (error) {
        console.error('Error canceling request:', error);
      }
      this.cancelTokens.delete(requestKey);
    }
  }

  async getAllPosts() {
    try {
      // Check cache first
      const cachedPosts = this._getCachedData('all', cache.posts);
      if (cachedPosts) {
        return cachedPosts;
      }

      // Make API call without cancellation token for now to simplify
      const response = await axiosInstance.get('/posts');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch posts');
      }
      
      const posts = response.data.posts || [];
      
      // Cache the result
      this._setCacheData('all', cache.posts, posts);
      
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
  }

  async createPost(formData) {
    try {
      // Clear posts cache when creating a new post
      cache.posts.clear();
      
      const response = await axiosInstance.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create post');
      }
      
      return response.data.post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  }

  async likePost(postId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to toggle like');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle like');
    }
  }

  async addComment(postId, content) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments`, { content });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add comment');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  async updateComment(postId, commentId, content) {
    try {
      const response = await axiosInstance.put(`/posts/${postId}/comments/${commentId}`, { content });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update comment');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to update comment');
    }
  }

  async deleteComment(postId, commentId) {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}/comments/${commentId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete comment');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete comment');
    }
  }

  async deleteReply(postId, commentId, replyId) {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}/comments/${commentId}/replies/${replyId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete reply');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete reply');
    }
  }

  async likeComment(postId, commentId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/like`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to like comment');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to like comment');
    }
  }

  async replyToComment(postId, commentId, content) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/replies`, { content });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reply to comment');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to reply to comment');
    }
  }

  async likeReply(postId, commentId, replyId) {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments/${commentId}/replies/${replyId}/like`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to like reply');
      }
      
      // Update cache with the new post data
      const updatedPost = response.data.post;
      this._updatePostInCache(updatedPost);
      
      return updatedPost;
    } catch (error) {
      console.error('Error liking reply:', error);
      throw new Error(error.response?.data?.message || 'Failed to like reply');
    }
  }

  async getPost(postId) {
    try {
      // Check cache first
      const cachedPost = this._getCachedData(postId, cache.postDetails);
      if (cachedPost) {
        return cachedPost;
      }

      const response = await axiosInstance.get(`/posts/${postId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch post');
      }
      
      const post = response.data.post;
      
      // Cache the result
      this._setCacheData(postId, cache.postDetails, post);
      
      return post;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch post');
    }
  }

  // Helper method to update a post in all caches
  _updatePostInCache(updatedPost) {
    if (!updatedPost || !updatedPost._id) return;
    
    // Update in post details cache
    this._setCacheData(updatedPost._id, cache.postDetails, updatedPost);
    
    // Update in posts list cache if it exists
    const cachedPosts = this._getCachedData('all', cache.posts);
    if (cachedPosts) {
      const updatedPosts = cachedPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      );
      this._setCacheData('all', cache.posts, updatedPosts);
    }
  }

  async deletePost(postId) {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}`);
      if (response.data.success) {
        // Clear cache after deleting a post
        cache.posts.clear();
        if (cache.postDetails.has(postId)) {
          cache.postDetails.delete(postId);
        }
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
        // Update cache with the new post data
        const updatedPost = response.data.post;
        this._updatePostInCache(updatedPost);
        return updatedPost;
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
      const cacheKey = `user-${username}`;
      const cachedPosts = this._getCachedData(cacheKey, cache.posts);
      if (cachedPosts) {
        return cachedPosts;
      }

      const response = await axiosInstance.get(`/posts/user/${username}`);
      
      if (response.data.success) {
        const posts = response.data.posts || [];
        this._setCacheData(cacheKey, cache.posts, posts);
        return posts;
      } else {
        throw new Error(response.data.message || 'Failed to fetch user posts');
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }
}

export default new PostService(); 