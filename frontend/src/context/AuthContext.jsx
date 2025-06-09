import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Configure axios to suppress 401 errors in the console
axiosInstance.interceptors.response.use(
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
                const response = await axiosInstance.get('/auth/me');
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
            // console.log('Attempting login with username:', username);
            const response = await axiosInstance.post(
                '/auth/login',
                { username, password },
                {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            if (response.data.success) {
                // Store the token in localStorage
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                // Set user data from login response if available
                if (response.data.data) {
                    setUser(response.data.data);
                    // console.log('Frontend: Logged in successfully.');
                    toast.success('Logged in successfully');
                    navigate('/home', { replace: true });
                    return true;
                }
                
                // If user data not in login response, fetch it
                try {
                    const userResponse = await axiosInstance.get('/auth/me', {
                        timeout: 5000 // Shorter timeout for user data fetch
                    });
                    if (userResponse.data.success) {
                        setUser(userResponse.data.data);
                        // console.log('Frontend: Logged in successfully (fetched).');
                        toast.success('Logged in successfully');
                        navigate('/home', { replace: true });
                        return true;
                    }
                } catch (userError) {
                    console.error('Error fetching user data:', userError);
                    // Don't show error toast here as we already have the token
                    // Just proceed with navigation
                    navigate('/home', { replace: true });
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            let errorMessage = 'Login failed';
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Login request timed out. Please try again.';
            } else if (error.code === 'ECONNRESET') {
                errorMessage = 'Connection lost. Please check your internet connection and try again.';
            } else if (error.response) {
                errorMessage = error.response.data.message || 'Invalid credentials';
            } else if (error.request) {
                errorMessage = 'No response from server. Please try again.';
            } else {
                errorMessage = 'Error setting up request. Please try again.';
            }
            
            toast.error(errorMessage);
            return false;
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
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
            const response = await axiosInstance.post(
                '/auth/signup',
                userData
            );
            
            if (response.data.success) {
                const userResponse = await axiosInstance.get('/auth/me');
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

    const updateUserAccountType = async (newType) => {
        if (!user || user.email !== 'darshkalathiya25@gmail.com') {
            throw new Error('Unauthorized');
        }

        try {
            const response = await axiosInstance.put('/auth/update-account-type', {
                accountType: newType
            });

            if (response.data.success) {
                setUser(prev => ({
                    ...prev,
                    accountType: newType
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating account type:', error);
            throw error;
        }
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        logout,
        signup,
        updateUserAccountType
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 