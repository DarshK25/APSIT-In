import axios from 'axios';

const INTERVAL = 5 * 60 * 1000; // 5 minutes
let intervalId = null;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const startKeepAlive = () => {
  if (intervalId) return;
  const ping = () => axios.get(`${API_BASE}/api/v1/health`).catch(() => {});
  ping();
  intervalId = setInterval(ping, INTERVAL);
};

export const stopKeepAlive = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
