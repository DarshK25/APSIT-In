import axiosInstance from './axiosConfig';
import { toast } from 'react-hot-toast';

class AuthService {
  async login(username, password) {
    try {
      const response = await axiosInstance.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  }

  async signup(userData) {
    try {
      const response = await axiosInstance.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
      throw error;
    }
  }

  async logout() {
    try {
      await axiosInstance.post('/auth/logout');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect to login even if the API call fails
      window.location.href = '/login';
    }
  }

  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  }

  async isAuthenticated() {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }
}

export default new AuthService(); 