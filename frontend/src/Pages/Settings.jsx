import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { Moon, Sun, Bell, Shield, Eye, EyeOff, Globe, Lock, Mail, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const Settings = () => {
    const { user, logout, setUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        showOnlineStatus: true,
        showActivity: true,
        showProfileInFeed: true,
        showEducationToNonConnections: true,
        showExperienceToNonConnections: true,
        showProjectsToNonConnections: true,
        showCertificationsToNonConnections: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    let confirmToastId = null;

    // Add state for account type
    const [selectedAccountType, setSelectedAccountType] = useState(user?.accountType || 'student');

    useEffect(() => {
        fetchSettings();
    }, []);

    // Add effect to update selectedAccountType when user changes
    useEffect(() => {
        setSelectedAccountType(user?.accountType || 'student');
    }, [user]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/v1/settings`, {
                withCredentials: true
            });
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (setting, value) => {
        setSaving(true);
        try {
            const response = await axios.put(
                `${API_URL}/api/v1/settings`,
                { [setting]: value },
                { withCredentials: true }
            );
            if (response.data.success) {
                setSettings(prev => ({ ...prev, [setting]: value }));
                toast.success('Settings updated successfully');
                
                if (setting === 'emailNotifications' && !value) {
                    toast('Important account notifications will still be sent to your email', {
                        icon: '⚠️',
                        duration: 6000
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Prevent multiple confirmation toasts
        if (confirmToastId !== null) {
            toast.dismiss(confirmToastId);
        }
        confirmToastId = toast((t) => (
            <div className="bg-white dark:bg-gray-900 rounded-xl px-2 py-1 min-w-[260px] max-w-[90vw] flex flex-col items-center">
                <div className="mb-4 text-gray-900 dark:text-gray-100 text-sm font-normal text-center">
                    Are you sure you want to change your password?
                </div>
                <div className="flex gap-3 justify-center w-full">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            confirmToastId = null;
                            try {
                                setSaving(true);
                                const response = await axios.post(
                                    `${API_URL}/api/v1/settings/change-password`,
                                    {
                                        currentPassword: passwordData.currentPassword,
                                        newPassword: passwordData.newPassword
                                    },
                                    { withCredentials: true }
                                );
                                if (response.data.success) {
                                    toast.success('Password changed successfully', {
                                        icon: '🔒',
                                        duration: 4000,
                                        style: {
                                            background: 'var(--toast-success-bg)',
                                            color: 'var(--toast-success-text)',
                                        },
                                    });
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                    setShowPasswordForm(false);
                                    setTimeout(() => {
                                        toast('Please login again with your new password', {
                                            icon: '🔒',
                                            duration: 4000,
                                            style: {
                                                background: 'var(--toast-success-bg)',
                                                color: 'var(--toast-success-text)',
                                            },
                                        });
                                        logout();
                                    }, 2000);
                                }
                            } catch (error) {
                                console.error('Failed to change password:', error);
                                toast.error(error.response?.data?.error || 'Failed to change password', {
                                    duration: 4000,
                                    style: {
                                        background: 'var(--toast-error-bg)',
                                        color: 'var(--toast-error-text)',
                                    },
                                });
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-800"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => { toast.dismiss(t.id); confirmToastId = null; }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error('Please enter your password to confirm');
            return;
        }

        try {
            setIsDeleting(true);
            const response = await axios.post(`${API_URL}/api/v1/users/delete-account`, {
                password: deletePassword
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                toast.success('Account deleted successfully');
                logout();
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
            toast.error(error.response?.data?.error || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setDeletePassword('');
        }
    };

    const handleAccountTypeChange = async (newType) => {
        if (!user || user.email !== 'darshkalathiya25@gmail.com') {
            toast.error('Unauthorized');
            return;
        }

        try {
            setSaving(true);
            const response = await axios.put(
                `${API_URL}/api/v1/auth/update-account-type`,
                { accountType: newType },
                { withCredentials: true }
            );

            if (response.data.success) {
                // Update local user state
                setUser(prev => {
                    let updatedUser = {
                        ...prev,
                        accountType: newType,
                        onboardingComplete: false // Reset onboarding status
                    };

                    // Clear account-specific fields that are no longer relevant
                    updatedUser.headline = null; // Clear headline to be re-generated
                    updatedUser.designation = null;
                    updatedUser.clubType = null;
                    updatedUser.foundedDate = null;
                    updatedUser.department = null; // Department might be common, but let OnboardingToast handle it
                    updatedUser.yearOfStudy = null;
                    updatedUser.education = [];
                    updatedUser.subjects = [];

                    return updatedUser;
                });
                setSelectedAccountType(newType);
                toast.success('Account type updated successfully');
            }
        } catch (error) {
            console.error('Failed to update account type:', error);
            toast.error(error.response?.data?.message || 'Failed to update account type');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen dark:bg-dark-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>
                
                {/* Account Type Switcher - Only for test account */}
                {user?.email === 'darshkalathiya25@gmail.com' && (
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Type</h2>
                        <div className="space-y-4">
                            <div className="w-full relative">
                                <select
                                    value={selectedAccountType}
                                    onChange={(e) => handleAccountTypeChange(e.target.value)}
                                    className="select select-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white mb-2 sm:mb-0"
                                    disabled={saving}
                                >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="club">Club</option>
                                </select>
                                {saving && (
                                    <div className="absolute top-0 right-0 h-full flex items-center pr-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Switch between different account types to test the platform.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Account Settings */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-4">
                            <Mail className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                </div>
                            </div>
                            
                            {showPasswordForm ? (
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="relative">
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                id="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                id="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                required
                                                minLength="6"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                                        >
                                            <Lock className="h-4 w-4" />
                                            <span>{saving ? 'Changing Password...' : 'Change Password'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordForm(false)}
                                            className="px-4 py-2 bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-opacity-80 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">Password</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 2 weeks ago</p>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordForm(true)}
                                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-opacity-80 transition-colors duration-200 flex items-center space-x-2"
                                    >
                                        <Lock className="h-4 w-4" />
                                        <span>Change Password</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Theme Settings */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {theme === 'dark' ? (
                                    <Moon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                                ) : (
                                    <Sun className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                                )}
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Theme</h2>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-opacity-80 transition-colors duration-200"
                            >
                                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                            </button>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-4">
                            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Receive important account notifications via email (password reset, account recovery, security alerts)
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">About Email Notifications</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    • Critical account notifications will always be sent regardless of this setting<br />
                                    • These include: password reset, account recovery, and security alerts<br />
                                    • Other email notifications will only be sent when this setting is enabled
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Show in Feed</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow your posts to appear in others' feeds</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('showProfileInFeed', !settings.showProfileInFeed)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.showProfileInFeed ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.showProfileInFeed ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Information Visible to Non-Connections</h3>
                                
                                <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Education</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Show your education history</p>
                                </div>
                                <button
                                            onClick={() => handleSettingChange('showEducationToNonConnections', !settings.showEducationToNonConnections)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                settings.showEducationToNonConnections ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                                    settings.showEducationToNonConnections ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Experience</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Show your work experience</p>
                                </div>
                                        <button
                                            onClick={() => handleSettingChange('showExperienceToNonConnections', !settings.showExperienceToNonConnections)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                settings.showExperienceToNonConnections ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                                    settings.showExperienceToNonConnections ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Projects</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Show your projects</p>
                                </div>
                                <button
                                            onClick={() => handleSettingChange('showProjectsToNonConnections', !settings.showProjectsToNonConnections)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                settings.showProjectsToNonConnections ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                                    settings.showProjectsToNonConnections ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account Section */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 transition-colors duration-200">
                        <div className="flex items-center space-x-2 mb-4">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Account</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                    Delete Account
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Enter your password to confirm
                                        </label>
                                        <input
                                            type="password"
                                            id="deletePassword"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeletePassword('');
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting || !deletePassword}
                                            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                                                isDeleting || !deletePassword
                                                    ? 'bg-red-400 cursor-not-allowed'
                                                    : 'bg-red-600 hover:bg-red-700'
                                            } text-white`}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;