import api from '../../../shared/api/axiosInstance';
export const registrationApi = {
  register: (tournamentId, team) => api.post('/register', { tournamentId, team }).then(r => r.data)
}
