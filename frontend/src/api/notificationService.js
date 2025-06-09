import axiosInstance from './axiosConfig';

const notificationService = {
    // Get all notifications for the current user
    getAllNotifications: async () => {
        try {
            const response = await axiosInstance.get('/notifications');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark a notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await axiosInstance.patch(
                `/notifications/${notificationId}/read`,
                {}
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await axiosInstance.patch(
                '/notifications/mark-all-read',
                {}
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete a notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await axiosInstance.delete(
                `/notifications/${notificationId}`
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Delete all notifications
    deleteAllNotifications: async () => {
        try {
            const response = await axiosInstance.delete(
                '/notifications/clear-all'
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default notificationService; 