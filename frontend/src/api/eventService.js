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

    // Get a single event by ID
    getEventById: async (eventId) => {
        try {
            const response = await axios.get(`${API_URL}/events/${eventId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    },

    // Get events organized by the current user/club
    getOrganizedEvents: async () => {
        try {
            const response = await axios.get(`${API_URL}/events/user/organized`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching organized events:', error);
            throw error;
        }
    },

    // Get events the user is registered for
    getMyEvents: async () => {
        try {
            const response = await axios.get(`${API_URL}/events/user/registered`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching registered events:', error);
            throw error;
        }
    },

    // Create a new event (protected route)
    createEvent: async (eventData) => {
        try {
            console.log('Sending event data to server:', Object.fromEntries(eventData));
            
            const response = await axios.post(`${API_URL}/events/create`, eventData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            console.log('Server response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            }
            throw error;
        }
    },

    // Update an event (protected route)
    updateEvent: async (eventId, eventData) => {
        try {
            console.log('Updating event with ID:', eventId);
            console.log('Update data being sent:', Object.fromEntries(eventData));

            const response = await axios.put(`${API_URL}/events/${eventId}`, eventData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            console.log('Update response from server:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update event');
            }

            return response.data;
        } catch (error) {
            console.error('Error in updateEvent:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
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
    },

    // Register for an event
    registerForEvent: async (eventId) => {
        try {
            const response = await axios.post(`${API_URL}/events/${eventId}/register`, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    },

    // Unregister from an event
    unregisterFromEvent: async (eventId) => {
        try {
            const response = await axios.post(`${API_URL}/events/${eventId}/unregister`, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error unregistering from event:', error);
            throw error;
        }
    }
};

export default eventService; 