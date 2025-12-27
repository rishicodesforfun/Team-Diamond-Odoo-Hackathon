import api from './api';

export const getRequests = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.equipment_id) params.append('equipment_id', filters.equipment_id);
  if (filters.type) params.append('type', filters.type);
  return api.get(`/requests?${params.toString()}`);
};

export const getRequestById = (id) => api.get(`/requests/${id}`);
export const createRequest = (data) => api.post('/requests', data);
export const updateRequestStatus = (id, status) => api.patch(`/requests/${id}/status`, { status });
export const updateRequest = (id, data) => api.patch(`/requests/${id}`, data);
export const getCalendarEvents = (start, end) => {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  return api.get(`/requests/calendar?${params.toString()}`);
};
export const getRequestStats = async () => {
  try {
    const response = await api.get('/requests/stats/summary');
    return response.data; // Return the actual data, not the axios response wrapper
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

