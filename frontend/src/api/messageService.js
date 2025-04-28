import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1/messages';

const messageService = {
    // Get all conversations
    getConversations: async () => {
        try {
            const response = await axios.get(`${API_URL}/conversations`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    // Get messages with a specific user
    getMessages: async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/${userId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    // Send a message
    sendMessage: async (recipientId, content) => {
        try {
            const response = await axios.post(`${API_URL}/send`, {
                recipientId,
                content
            }, {
                withCredentials: true
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
            const response = await axios.post(`${API_URL}/share-post`, {
                recipientId,
                postId
            }, {
                withCredentials: true
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
            const response = await axios.post(`${API_URL}/mark-read/${userId}`, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }
};

export default messageService; 