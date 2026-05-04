import api from './api';

const evenementService = {
  getEvenements(page = 0, size = 12) {
    return api.get('/evenements', {
      params: {
        page,
        size,
      },
    });
  },

  getEvenement(id) {
    return api.get(`/evenements/${id}`);
  },

  getParticipants(id) {
    return api.get(`/evenements/${id}/participants`);
  },

  createEvenement(data) {
    return api.post('/evenements', data);
  },

  updateEvenement(id, data) {
    return api.put(`/evenements/${id}`, data);
  },

  deleteEvenement(id) {
    return api.delete(`/evenements/${id}`);
  },

  toggleParticipation(id) {
    return api.post(`/evenements/${id}/participer`);
  },
};

export default evenementService;
