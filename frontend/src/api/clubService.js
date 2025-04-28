import axiosInstance from './axiosConfig';
import { toast } from 'react-hot-toast';

const BASE_URL = '/clubs';

// Club service for managing club-related API calls
const clubService = {
  // Get all clubs
  getAllClubs: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/all`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all clubs:', error);
      toast.error('Failed to load clubs');
      throw error;
    }
  },

  // Get clubs with events
  getClubsWithEvents: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/with-events`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching clubs with events:', error);
      toast.error('Failed to load clubs with events');
      throw error;
    }
  },

  // Get clubs where current user is a member
  getUserClubs: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/my-clubs`);
      return response.data.data;
    } catch (error) {
      console.error('Error checking user club memberships:', error);
      return []; // Return empty array on error instead of throwing
    }
  },

  // Get a specific club by ID
  getClubById: async (clubId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${clubId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching club ${clubId}:`, error);
      toast.error('Failed to load club details');
      throw error;
    }
  },

  // Get a specific club by username
  getClubByUsername: async (username) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/username/${username}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching club with username ${username}:`, error);
      toast.error('Failed to load club details');
      throw error;
    }
  },

  // Get all members of a club
  getClubMembers: async (clubId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${clubId}/members`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching members of club ${clubId}:`, error);
      toast.error('Failed to load club members');
      throw error;
    }
  },

  // Check if current user is a member of a club
  checkClubMembership: async (clubId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${clubId}/check-membership`);
      return response.data;
    } catch (error) {
      console.error(`Error checking membership for club ${clubId}:`, error);
      throw error;
    }
  },

  // Add a new member to a club
  addClubMember: async (clubId, userId, role) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${clubId}/members`, {
        userId,
        role
      });
      toast.success('Member added successfully');
      return response.data.data;
    } catch (error) {
      console.error(`Error adding member to club ${clubId}:`, error);
      toast.error(error.response?.data?.message || 'Failed to add member');
      throw error;
    }
  },

  // Update a member's role in a club
  updateMemberRole: async (clubId, userId, role) => {
    try {
      if (!userId) {
        console.error("Missing userId in updateMemberRole");
        toast.error("Cannot update role: Invalid user ID");
        throw new Error("User ID is required");
      }

      if (!clubId) {
        console.error("Missing clubId in updateMemberRole");
        toast.error("Cannot update role: Invalid club ID");
        throw new Error("Club ID is required");
      }

      console.log(`Updating role for user ${userId} in club ${clubId} to ${role}`);
      const response = await axiosInstance.put(`${BASE_URL}/${clubId}/members/${userId}`, {
        role
      });
      
      console.log("Role update response:", response.data);
      toast.success('Member role updated successfully');
      return response.data.data;
    } catch (error) {
      console.error(`Error updating member role in club ${clubId}:`, error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update member role');
      throw error;
    }
  },

  // Remove a member from a club
  removeClubMember: async (clubId, userId) => {
    try {
      if (!userId) {
        console.error("Missing userId in removeClubMember");
        toast.error("Cannot remove member: Invalid user ID");
        throw new Error("User ID is required");
      }

      if (!clubId) {
        console.error("Missing clubId in removeClubMember");
        toast.error("Cannot remove member: Invalid club ID");
        throw new Error("Club ID is required");
      }

      console.log(`Removing user ${userId} from club ${clubId}`);
      const response = await axiosInstance.delete(`${BASE_URL}/${clubId}/members/${userId}`);
      
      console.log("Remove member response:", response.data);
      toast.success('Member removed successfully');
      return response.data.data;
    } catch (error) {
      console.error(`Error removing member from club ${clubId}:`, error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to remove member');
      throw error;
    }
  }
};

export default clubService; 