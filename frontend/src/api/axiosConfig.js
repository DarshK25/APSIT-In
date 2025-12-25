import axios from 'axios';
import { toast } from 'react-hot-toast';

// Determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Set the API URL based on environment
const API_BASE_URL = isDevelopment
  ? 'http://localhost:3000'  // Development
  : 'https://apsit-in.onrender.com';  // Production

console.log('Current environment:', isDevelopment ? 'Development' : 'Production');
console.log('Using API URL:', API_BASE_URL);
console.log('API_URL:', `${API_BASE_URL}/api/v1`);
console.log('Current hostname:', window.location.hostname);
console.log('Current origin:', window.location.origin);

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor (no need to add Authorization header since we use cookies)
axiosInstance.interceptors.request.use(
  (config) => {
    // The withCredentials: true setting will automatically include cookies
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
      // No need to clear localStorage since we use httpOnly cookies

      // Only redirect if:
      // 1. Not already on login/signup/landing pages
      // 2. Not the initial auth check (which is expected to fail for non-authenticated users)
      const currentPath = window.location.pathname;
      const isPublicRoute = ['/', '/login', '/signup'].includes(currentPath);
      const isAuthCheckRequest = originalRequest.url?.includes('/auth/me');

      if (!isPublicRoute && !isAuthCheckRequest) {
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 