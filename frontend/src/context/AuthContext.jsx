import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Configure axios to suppress 401 errors in the console
axios.interceptors.response.use(
  response => response,
  error => {
    // Suppress 401 errors in the console
    if (error.response && error.response.status === 401) {
      // Do nothing, just return the error
      return Promise.reject(error);
    }
    // For other errors, let them propagate
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check if user is authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/v1/auth/me', {
                    withCredentials: true
                });
                if (response.data.data) {
                    setUser(response.data.data);
                }
            } catch (error) {
                // Silently handle 401 errors as they are expected when not logged in
                if (error.response?.status !== 401) {
                    console.error('Auth check failed:', error);
                }
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post(
                'http://localhost:3000/api/v1/auth/login',
                { username, password },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                const userResponse = await axios.get('http://localhost:3000/api/v1/auth/me', {
                    withCredentials: true
                });
                setUser(userResponse.data.data);
                toast.success('Logged in successfully');
                return true;  // Return success status
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            toast.error(error.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:3000/api/v1/auth/logout', {}, {
                withCredentials: true
            });
            setUser(null);
            toast.success('Logged out successfully');
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Logout failed');
        }
    };

    const signup = async (userData) => {
        try {
            const response = await axios.post(
                'http://localhost:3000/api/v1/auth/signup',
                userData,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                const userResponse = await axios.get('http://localhost:3000/api/v1/auth/me', {
                    withCredentials: true
                });
                setUser(userResponse.data.data);
                toast.success('Account created successfully');
                navigate('/profile');
                return true;
            }
        } catch (error) {
            console.error('Signup failed:', error);
            toast.error(error.response?.data?.message || 'Signup failed');
            return false;
        }
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        logout,
        signup
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 