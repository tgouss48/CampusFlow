import api from './api';

const noCacheHeaders = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const annonceService = {
  getAnnonces: (page = 0, size = 20, statut = null) => {
    const params = { page, size };
    if (statut) params.statut = statut;
    return api.get('/annonces', { params, headers: noCacheHeaders });
  },

  createAnnonce: (data) => {
    return api.post('/annonces', data);
  },

  updateAnnonce: (id, data) => {
    return api.put(`/annonces/${id}`, data);
  },

  deleteAnnonce: (id) => {
    return api.delete(`/annonces/${id}`);
  },

  toggleLike: (id) => {
    return api.post(`/annonces/${id}/like`);
  },
};

export default annonceService;
