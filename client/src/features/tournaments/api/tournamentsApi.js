import api from '../../../shared/api/axiosInstance';

export const tournamentsApi = {
    getAll: () => api.get('/tournaments').then(r => r.data),
    getMatches: () => api.get('/matches').then(r => r.data),
    getTeams: () => api.get('/teams').then(r => r.data),
};