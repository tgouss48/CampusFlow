import { useState, useMemo } from 'react';
import { FiClock, FiHeart, FiMessageCircle, FiUser, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import annonceService from '../../services/annonceService';

export default function AnnonceCard({
  annonce,
  onOpenComments,
  onLikeChange,
  onEdit,
  onDelete,
  showOwnerActions = false,
  plain = false,
}) {
  const { user, isAuthenticated } = useAuth();
  const [likeBusy, setLikeBusy] = useState(false);

  const { id, type, liked, likeCount } = annonce;

  const { isRealOwner, isAdei } = useMemo(() => {
    if (!isAuthenticated || !user || !annonce) return { isRealOwner: false, isAdei: false };
    
    const uid = String(user.id || user.userId || '');
    if (!uid) return { isRealOwner: false, isAdei: false };

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const adei = roles.some(r => ['ADEI', 'ROLE_ADEI'].includes(String(r).toUpperCase())) || 
                 ['ADEI', 'ROLE_ADEI'].includes(String(user.role).toUpperCase());
    
    const ownerId = String(
      annonce.utilisateurId || 
      annonce.utilisateur?.id || 
      annonce.user?.id || 
      annonce.owner?.id || 
      annonce.ownerId || 
      ''
    );

    return { isRealOwner: uid === ownerId, isAdei: adei };
  }, [isAuthenticated, user, annonce]);

  const handleLike = (e) => {
    e.stopPropagation();
    if (likeBusy) return;
    setLikeBusy(true);
    annonceService
      .toggleLike(id)
      .then(() => {
        if (liked) {
          onLikeChange?.(id, { liked: false, likeCount: Math.max(0, likeCount - 1) });
        } else {
          onLikeChange?.(id, { liked: true, likeCount: likeCount + 1 });
        }
      })
      .catch((err) => console.error('handleLike', err))
      .finally(() => setLikeBusy(false));
  };

  const handleAction = (e, callback) => {
    e.stopPropagation();
    callback?.(annonce);
  };

  const openComments = (e) => {
    e.stopPropagation();
    onOpenComments?.(annonce);
  };

  const truncate = (text) => {
    if (!text) return '';
    return text.length > 120 ? text.substring(0, 117) + '...' : text;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatOwnerDisplayName = (a, currentUser) => {
    const owner = a.utilisateur || a.user || a.owner;
    const uid = String(currentUser?.id || currentUser?.userId || '');
    const ownerId = String(
      owner?.id || 
      owner?.userId || 
      a.utilisateurId || 
      a.ownerId || 
      ''
    );

    if (uid && ownerId && uid === ownerId) {
      return 'Moi';
    }

    if (!owner) {
      const direct = a.ownerDisplayName || a.owner_display_name || a.authorName || a.utilisateurNom;
      if (direct && !['membre', 'utilisateur', 'user'].includes(String(direct).toLowerCase())) {
        return direct;
      }
      return 'Utilisateur';
    }

    const name =
      owner.fullName ||
      [owner.prenom || owner.firstName, owner.nom || owner.lastName].filter(Boolean).join(' ') ||
      owner.email ||
      owner.username ||
      'Utilisateur';

    return name;
  };

  const typeBadgeClass =
    type === 'OFFRE'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : 'bg-amber-50 text-amber-700 border-amber-100';

  const containerClass = plain
    ? 'bg-white'
    : 'group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl';

  return (
    <article className={containerClass} onClick={openComments}>
      {!plain && (
        <div
          className={`h-1.5 w-full rounded-t-[24px] bg-gradient-to-r ${
            type === 'OFFRE'
              ? 'from-primary-500 via-primary-400 to-blue-300'
              : 'from-amber-500 via-orange-400 to-amber-300'
          }`}
        />
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${typeBadgeClass}`}
            >
              {type === 'OFFRE' ? 'Offre' : 'Demande'}
            </span>
            {annonce.statut === 'SUPPRIME' && (
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                Supprimée
              </span>
            )}
          </div>

          {showOwnerActions && !plain && (
            <div className="flex items-center gap-1.5">
              {isRealOwner && (
                <button
                  type="button"
                  onClick={(e) => handleAction(e, onEdit)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 shadow-sm"
                  aria-label="Modifier"
                  title="Modifier"
                >
                  <FiEdit2 size={14} />
                </button>
              )}
              {(isRealOwner || isAdei) && (
                <button
                  type="button"
                  onClick={(event) => handleAction(event, onDelete)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 shadow-sm"
                  aria-label="Supprimer"
                  title="Supprimer"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-base sm:text-lg font-bold leading-tight text-slate-900 transition-colors duration-200 group-hover:text-primary-700">
          {annonce.titre}
        </h3>

        <p className="mb-4 min-h-[40px] text-[13px] sm:text-sm leading-relaxed text-slate-600">
          {truncate(annonce.description)}
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {annonce.categorie && (
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-slate-600">
              {annonce.categorie.nom}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-slate-500">
            <FiClock size={11} className="text-slate-400" />
            <span>{formatDate(annonce.createdAt)}</span>
          </span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-y-3 gap-x-4 border-t border-slate-100 px-5 pb-5 pt-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            disabled={likeBusy || annonce.statut === 'SUPPRIME'}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-[13px] sm:text-sm font-bold transition-all ${
              liked
                ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-500/10'
                : 'text-slate-500 hover:bg-rose-50 hover:text-rose-500'
            } ${likeBusy || annonce.statut === 'SUPPRIME' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiHeart size={15} className={liked ? 'fill-current' : ''} />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={openComments}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-[13px] sm:text-sm font-bold text-slate-500 transition-all hover:bg-sky-50 hover:text-sky-700"
          >
            <FiMessageCircle size={16} />
            <span>{annonce.commentaireCount || 0}</span>
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-2 text-slate-500">
          <FiUser size={13} className="shrink-0 text-slate-400" />
          <span className="truncate text-[11px] sm:text-xs font-medium max-w-[100px] sm:max-w-[150px]">
            {formatOwnerDisplayName(annonce, user)}
          </span>
        </div>
      </div>
    </article>
  );
}
