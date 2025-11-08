import api from '../../../shared/api/axiosInstance';

export const resultsApi = {
    getMatches: () => api.get('/matches').then(r => r.data),
    sendResult: (matchId, scoreA, scoreB) =>
        api.post('/match-result', { matchId, scoreA, scoreB }).then(r => r.data),
    deleteMatch: (id) => api.delete(`/match/${id}`).then(r => r.data),
};
