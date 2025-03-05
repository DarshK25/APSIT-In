import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

console.log('API_URL:', API_URL); // Debug log

const eventService = {
    // Get all events (public route)
    getAllEvents: async (queryParams = {}) => {
        try {
            console.log('Fetching events with params:', queryParams);
            const params = new URLSearchParams(queryParams);
            const url = `${API_URL}/events?${params}`;
            console.log('Request URL:', url);
            
            const response = await axios.get(url); // Remove withCredentials for public route
            console.log('Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error.response || error);
            throw error;
        }
    },

    // Create a new event (protected route)
    createEvent: async (eventData) => {
        try {
            const formData = new FormData();
            Object.entries(eventData).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await axios.post(`${API_URL}/events`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    // Update an event (protected route)
    updateEvent: async (eventId, eventData) => {
        try {
            const formData = new FormData();
            Object.entries(eventData).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await axios.put(`${API_URL}/events/${eventId}`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    // Delete an event (protected route)
    deleteEvent: async (eventId) => {
        try {
            const response = await axios.delete(`${API_URL}/events/${eventId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
};

export default eventService; 