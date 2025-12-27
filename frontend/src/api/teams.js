import api from './api';

export const getTeams = () => api.get('/teams');
export const getTeamById = (id) => api.get(`/teams/${id}`);
export const createTeam = (name) => api.post('/teams', { name });

