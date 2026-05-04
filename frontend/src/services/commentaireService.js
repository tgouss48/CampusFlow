import api from './api';

const commentaireService = {
  // Lister les commentaires d'une annonce
  getCommentaires: (annonceId, page = 0, size = 20) => {
    return api.get('/commentaires', { params: { annonceId, page, size } });
  },

  // Ajouter un commentaire
  addCommentaire: (data) => {
    return api.post('/commentaires', data);
  },

  // Modifier un commentaire
  updateCommentaire: (id, data) => {
    return api.put(`/commentaires/${id}`, data);
  },

  // Supprimer un commentaire
  deleteCommentaire: (id) => {
    return api.delete(`/commentaires/${id}`);
  },

  // Lister les réponses d'un commentaire parent
  getReponses: (parentId, page = 0, size = 20) => {
    return api.get(`/commentaires/${parentId}/reponses`, { params: { page, size } });
  },
};

export default commentaireService;
