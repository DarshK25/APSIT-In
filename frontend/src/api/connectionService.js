import axiosInstance from './axiosConfig';
import { getUnreadCounts } from './userService';

class ConnectionService {
  async getConnectionRequests() {
    const response = await axiosInstance.get('/connections/requests');
    return response.data;
  }

  async getConnections() {
    const response = await axiosInstance.get('/connections');
    return response.data;
  }

  async sendConnectionRequest(userId) {
    const response = await axiosInstance.post(`/connections/request/${userId}`);
    // Refresh unread counts after sending a request
    try {
      const unreadCounts = await getUnreadCounts();
      window.dispatchEvent(new CustomEvent('unreadCountsUpdated', { detail: unreadCounts }));
    } catch (error) {
      console.error('Failed to refresh unread counts:', error);
    }
    return response.data;
  }

  async acceptConnectionRequest(requestId) {
    const response = await axiosInstance.put(`/connections/accept/${requestId}`);
    // Refresh unread counts after accepting a request
    try {
      const unreadCounts = await getUnreadCounts();
      window.dispatchEvent(new CustomEvent('unreadCountsUpdated', { detail: unreadCounts }));
    } catch (error) {
      console.error('Failed to refresh unread counts:', error);
    }
    return response.data;
  }

  async rejectConnectionRequest(requestId) {
    const response = await axiosInstance.put(`/connections/reject/${requestId}`);
    return response.data;
  }

  async removeConnection(userId) {
    const response = await axiosInstance.delete(`/connections/${userId}`);
    return response.data;
  }

  async getConnectionStatus(userId) {
    const response = await axiosInstance.get(`/connections/status/${userId}`);
    return response.data;
  }
}

export default new ConnectionService(); 