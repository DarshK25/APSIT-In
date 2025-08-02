import axios from 'axios';
import { toast } from 'react-hot-toast';

// Determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Set the API URL based on environment
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000'  // Development
  : 'https://apsit-in.onrender.com';  // Production

console.log('Current environment:', isDevelopment ? 'Development' : 'Production');
console.log('Using API URL:', API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.');
      return Promise.reject(error);
    }

    // Handle connection reset errors
    if (error.code === 'ECONNRESET') {
      toast.error('Connection lost. Please check your internet connection and try again.');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token'); // Clear invalid token

      // Instead of immediate redirect and toast, let AuthContext handle it.
      // This interceptor should primarily ensure the token is cleared.
      // if (window.location.pathname !== '/login') {
      //   window.location.href = '/login';
      //   toast.error('Session expired. Please login again.');
      // }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 