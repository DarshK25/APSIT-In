import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for sending cookies
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        toast.error('Please login to continue');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 