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
            console.log('Attempting login with username:', username);
            const response = await axios.post(
                'http://localhost:3000/api/v1/auth/login',
                { username, password },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                // Fetch user data after successful login response
                const userResponse = await axios.get('http://localhost:3000/api/v1/auth/me', {
                    withCredentials: true
                });
                setUser(userResponse.data.data);
                console.log('Frontend: Logged in successfully (fetched).');

                // Show special message for test account
                if (userResponse.data.data.email === 'darshkalathiya25@gmail.com') {
                    toast.success('Logged in successfully');
                    // Show special test account message after a short delay
                    setTimeout(() => {
                        toast.custom((t) => (
                            <div className="bg-blue-100 dark:bg-blue-800 rounded-lg p-4 shadow-lg border border-blue-200 dark:border-blue-700">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Test Account Features
                                        </h3>
                                        <div className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                                            <p>You can switch between different account types (Student, Faculty, Club) in the Settings page.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ), {
                            duration: 8000,
                            position: 'top-center',
                        });
                    }, 1000);
                } else {
                    toast.success('Logged in successfully');
                }
                
                navigate('/home', { replace: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            let errorMessage = 'Login failed';
            
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response:', error.response.data);
                errorMessage = error.response.data.message || 'Invalid credentials';
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                errorMessage = 'No response from server. Please try again.';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error setting up request:', error.message);
                errorMessage = 'Error setting up request. Please try again.';
            }
            
            toast.error(errorMessage);
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

    const updateUserAccountType = async (newType) => {
        if (!user || user.email !== 'darshkalathiya25@gmail.com') {
            throw new Error('Unauthorized');
        }

        try {
            const response = await axios.put(`${API_URL}/api/v1/auth/update-account-type`, {
                accountType: newType
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
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