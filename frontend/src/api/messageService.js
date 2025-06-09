import axios from 'axios';
import axiosInstance from './axiosConfig';

const messageService = {
    // Get all conversations
    getConversations: async () => {
        try {
            const response = await axiosInstance.get('/messages/conversations');
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    // Get messages with a specific user
    getMessages: async (userId) => {
        try {
            const response = await axiosInstance.get(`/messages/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    // Send a message
    sendMessage: async (recipientId, content) => {
        try {
            const response = await axiosInstance.post('/messages/send', {
                recipientId,
                content
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Share a post via message
    sharePostInMessage: async (recipientId, postId) => {
        try {
            const response = await axiosInstance.post('/messages/share-post', {
                recipientId,
                postId
            });
            return response.data;
        } catch (error) {
            console.error('Error sharing post in message:', error);
            throw error;
        }
    },

    // Mark messages as read
    markMessagesAsRead: async (userId) => {
        try {
            const response = await axiosInstance.post(`/messages/mark-read/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }
};

export default messageService; 