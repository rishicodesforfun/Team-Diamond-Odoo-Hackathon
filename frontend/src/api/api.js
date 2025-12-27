import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests (optional - bypassed for now)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If no token, still allow request (bypass auth)
  return config;
});

// Handle 401 errors (bypassed - don't redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 - just log it
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - continuing without auth');
    }
    return Promise.reject(error);
  }
);

export default api;

