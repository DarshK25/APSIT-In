import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { Moon, Sun, Bell, Shield, Eye, Globe, Lock, Mail } from 'lucide-react';

const Settings = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: 'public',
        allowTagging: true,
        showOnlineStatus: true,
        allowMessaging: 'everyone',
        showActivity: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/users/settings', {
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
                '/api/v1/users/settings',
                { [setting]: value },
                { withCredentials: true }
            );
            if (response.data.success) {
                setSettings(prev => ({ ...prev, [setting]: value }));
                toast.success('Settings updated successfully');
                
                // If email notifications are disabled, show a warning
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
        
        try {
            setSaving(true);
            const response = await axios.post(
                '/api/v1/users/settings/change-password',
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                toast.success('Password changed successfully');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowPasswordForm(false);
                
                // Logout user after password change for security
                setTimeout(() => {
                    toast('Please login again with your new password', { icon: '🔒' });
                    logout();
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to change password:', error);
            toast.error(error.response?.data?.error || 'Failed to change password');
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
                                    <div>
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                            minLength="6"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Change Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordForm(false)}
                                            className="px-4 py-2 bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-opacity-80"
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
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.emailNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-hover'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.pushNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-hover'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
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
                                    <h3 className="font-medium text-gray-900 dark:text-white">Profile Visibility</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile</p>
                                </div>
                                <select
                                    value={settings.profileVisibility}
                                    onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                                    className="rounded-lg border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="public">Public</option>
                                    <option value="connections">Connections Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Allow Tagging</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Let others tag you in posts</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('allowTagging', !settings.allowTagging)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.allowTagging ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-hover'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.allowTagging ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Online Status</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Show when you're active</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.showOnlineStatus ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-hover'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Messaging</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Control who can send you messages</p>
                                </div>
                                <select
                                    value={settings.allowMessaging}
                                    onChange={(e) => handleSettingChange('allowMessaging', e.target.value)}
                                    className="rounded-lg border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="everyone">Everyone</option>
                                    <option value="connections">Connections Only</option>
                                    <option value="none">No One</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Activity Status</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Show your activity on posts and comments</p>
                                </div>
                                <button
                                    onClick={() => handleSettingChange('showActivity', !settings.showActivity)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settings.showActivity ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-hover'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            settings.showActivity ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;