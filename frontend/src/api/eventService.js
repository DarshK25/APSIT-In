import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const eventService = {
    // Get all events
    getAllEvents: async () => {
        try {
            const response = await axios.get(`${API_URL}/events`);
            return response.data.events;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    // Create a new event (admin only)
    createEvent: async (eventData) => {
        try {
            const response = await axios.post(`${API_URL}/events`, eventData);
            return response.data.event;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    // Update an event (admin/moderator only)
    updateEvent: async (eventId, eventData) => {
        try {
            const response = await axios.put(`${API_URL}/events/${eventId}`, eventData);
            return response.data.event;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    // Delete an event (admin only)
    deleteEvent: async (eventId) => {
        try {
            await axios.delete(`${API_URL}/events/${eventId}`);
            return eventId;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
};

export default eventService; 