import api from './api';

export const getEquipment = () => api.get('/equipment');
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.patch(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);
export const getEquipmentAutofill = (id) => api.get(`/equipment/${id}/autofill`);
export const getEquipmentRequestsCount = (id) => api.get(`/equipment/${id}/requests/count`);

