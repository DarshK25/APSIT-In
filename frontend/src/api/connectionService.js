import axiosInstance from './axiosConfig';

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
    return response.data;
  }

  async acceptConnectionRequest(requestId) {
    const response = await axiosInstance.put(`/connections/accept/${requestId}`);
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