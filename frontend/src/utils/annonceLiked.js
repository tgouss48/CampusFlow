/**
 * Lit l'état « liké par l'utilisateur courant » depuis une annonce API,
 * quelle que soit la forme renvoyée (boolean, alias Jackson, chaîne, nombre).
 */
export function parseAnnonceLiked(annonce) {
  if (!annonce || typeof annonce !== 'object') return false;
  const v = annonce.liked ?? annonce.isLiked ?? annonce.likedByCurrentUser;
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0' || s === '') return false;
  }
  return false;
}
