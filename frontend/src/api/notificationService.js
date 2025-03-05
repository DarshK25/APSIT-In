import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/notifications`;

const notificationService = {
    // Get all notifications for the current user
    getAllNotifications: async () => {
        try {
            const response = await axios.get(API_URL, { withCredentials: true });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark a notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await axios.patch(
                `${API_URL}/${notificationId}/read`,
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await axios.patch(
                `${API_URL}/mark-all-read`,
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete a notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await axios.delete(
                `${API_URL}/${notificationId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete all notifications
    deleteAllNotifications: async () => {
        try {
            const response = await axios.delete(
                `${API_URL}/clear-all`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default notificationService; 