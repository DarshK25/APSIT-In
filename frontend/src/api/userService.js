import axios from "axios";
import axiosInstance from './axiosConfig';
import { toast } from 'react-hot-toast';

class UserService {
  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  }

  async getPublicProfile(username) {
    try {
      const response = await axiosInstance.get(`/users/profile/${username}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching public profile:", error);
      throw error;
    }
  }

  async updateProfile(userData) {
    const response = await axiosInstance.put('/users/profile', userData);
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to update profile');
    }
  }

  async getSuggestedUsers() {
    const response = await axiosInstance.get('/users/suggestions');
    return response.data;
  }

  async getConnections() {
    const response = await axiosInstance.get('/connections');
    return response.data;
  }

  async sendConnectionRequest(userId) {
    const response = await axiosInstance.post(`/connections/request/${userId}`);
    return response.data;
  }

  async acceptConnectionRequest(requestId) {
    const response = await axiosInstance.put(`/connections/accept/${requestId}`);
    return response.data;
  }

  async rejectConnectionRequest(requestId) {
    const response = await axiosInstance.put(`/connections/reject/${requestId}`);
    return response.data;
  }

  async removeConnection(userId) {
    const response = await axiosInstance.delete(`/connections/${userId}`);
    return response.data;
  }

  async getConnectionRequests() {
    const response = await axiosInstance.get('/connections/requests');
    return response.data;
  }
}

// Export a single instance
const userService = new UserService();
export default userService;

// Standalone functions
export const getUserProfile = async () => {
    try {
        const response = await axiosInstance.get('/auth/me');
        return response.data.data;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (updatedData) => {
    try {
        const response = await axiosInstance.put('/users/profile', updatedData);
        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "apsitin_preset");

    try {
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw error;
    }
};

export const getUserRecommendations = async (page = 1) => {
    try {
        const response = await axiosInstance.get(`/users/suggestions?page=${page}`);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch recommendations');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch recommendations';
        throw new Error(errorMessage);
    }
};

export const sendConnectionRequest = async (userId) => {
    try {
        const response = await axiosInstance.post(`/connections/request/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error("Error sending connection request:", error);
        throw error;
    }
};

export const getConnectionStatus = async (userId) => {
    try {
        const response = await axiosInstance.get(`/connections/status/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error("Error getting connection status:", error);
        throw error;
    }
};

export const getPublicProfile = async (username) => {
    try {
        const response = await axiosInstance.get(`/users/${username}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching public profile:", error);
        throw error;
    }
};

export const getUnreadCounts = async () => {
    try {
        const response = await axiosInstance.get('/users/unread-counts');
        return response.data.data;
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        throw error;
    }
};

export const getUserPosts = async (username) => {
    try {
      const response = await axiosInstance.get(`/users/${username}/posts`);
      return response.data.posts;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error.response?.data || error.message;
    }
};
  
// Certification API calls
export const addCertification = async (certificationData) => {
    const response = await axiosInstance.post('/users/certifications', certificationData);
    return response.data;
};

export const updateCertification = async (certificationId, certificationData) => {
    const response = await axiosInstance.put(`/users/certifications/${certificationId}`, certificationData);
    return response.data;
};

export const deleteCertification = async (certificationId) => {
    const response = await axiosInstance.delete(`/users/certifications/${certificationId}`);
    return response.data;
};
  