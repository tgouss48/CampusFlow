import { useState, useEffect, useMemo } from 'react';
import { FiUser, FiClock, FiTrash2, FiEdit3, FiCheck, FiX, FiMessageCircle, FiSend, FiAlertCircle } from 'react-icons/fi';
import { formatOwnerDisplayName } from '../../utils/ownerDisplayName';
import { useAuth } from '../../context/AuthContext';
import commentaireService from '../../services/commentaireService';
import ConfirmModal from '../common/ConfirmModal';

export default function CommentItem({
  comment,
  annonceId,
  onUpdated,
  onCommentPatched,
  onCommentRemoved,
  onReplyThreadRefresh,
  compact,
  bare,
}) {
  const { user, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.contenu);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localReponseCount, setLocalReponseCount] = useState(comment.reponseCount || 0);

  useEffect(() => {
    setLocalReponseCount(comment.reponseCount || 0);
  }, [comment.reponseCount]);

  const isOwner = user && comment.ownerId === user.id;
  const isAdei = useMemo(() => {
    return user?.roles?.some((r) => ['ADEI', 'ROLE_ADEI'].includes(String(r).toUpperCase()));
  }, [user]);

  const isSupprime = comment.statut === 'SUPPRIME';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await commentaireService.updateCommentaire(comment.id, { contenu: editContent.trim() });
      setEditing(false);
      if (onCommentPatched) {
        onCommentPatched(res.data);
      } else if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await commentaireService.deleteCommentaire(comment.id);
      if (onCommentRemoved) {
        onCommentRemoved(comment.id);
      } else if (onUpdated) {
        onUpdated();
      }
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Error deleting comment:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await commentaireService.addCommentaire({
        contenu: replyContent.trim(),
        annonceId: annonceId,
        parentId: comment.id,
      });
      setReplyContent('');
      setReplying(false);
      setLocalReponseCount(prev => prev + 1);
      loadReplies();
      if (onReplyThreadRefresh) {
        onReplyThreadRefresh();
      } else if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const loadReplies = async () => {
    if (localReponseCount === 0 && replies.length === 0) return;
    setLoadingReplies(true);
    try {
      const res = await commentaireService.getReponses(comment.id);
      setReplies(res.data.content || []);
      setShowReplies(true);
    } catch (err) {
      console.error('Error loading replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplyPatched = (patchedReply) => {
    setReplies((prev) => prev.map((r) => (r.id === patchedReply.id ? patchedReply : r)));
  };

  const handleReplyRemoved = (replyId) => {
    setReplies((prev) => {
      const next = prev.filter((r) => r.id !== replyId);
      if (next.length === 0) {
        setShowReplies(false);
      }
      return next;
    });
    setLocalReponseCount((prev) => Math.max(0, prev - 1));
    if (onReplyThreadRefresh) {
      onReplyThreadRefresh();
    } else if (onUpdated) {
      onUpdated();
    }
  };

  const shellClass = bare
    ? `border-b border-slate-200/90 ${compact ? 'py-3' : 'py-4'} last:border-b-0`
    : `glass rounded-xl hover:border-slate-300 transition-all duration-200 ${compact ? 'p-3' : 'p-4'}`;

  return (
    <div id={`comment-${comment.id}`} className="group">
      <ConfirmModal
        open={confirmDeleteOpen}
        title={isSupprime ? "Supprimer définitivement ?" : "Supprimer ce commentaire ?"}
        message={
          isSupprime
            ? "Voulez-vous vraiment supprimer définitivement ce commentaire de la base de données ?"
            : "Voulez-vous vraiment supprimer ce commentaire ? Il sera masqué pour les utilisateurs."
        }
        confirmLabel={deleting ? 'Suppression...' : (isSupprime ? 'Supprimer définitivement' : 'Supprimer')}
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => (deleting ? null : setConfirmDeleteOpen(false))}
      />
      <div className={shellClass}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shrink-0">
              <FiUser size={12} className="text-white" />
            </div>
            <span className="text-[13px] sm:text-sm font-medium text-slate-800 truncate max-w-[10rem] sm:max-w-xs">
              {formatOwnerDisplayName(comment, user)}
            </span>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 shrink-0">
              <FiClock size={10} />
              {formatDate(comment.createdAt)}
            </span>
            {isSupprime && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                <FiAlertCircle size={10} />
                Supprimé
              </span>
            )}
          </div>

          {/* Actions (owner or ADEI) */}
          {(isOwner || isAdei) && !editing && (
            <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {isOwner && !isSupprime && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 text-slate-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-slate-100"
                  title="Modifier"
                >
                  <FiEdit3 size={13} />
                </button>
              )}
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="p-1.5 text-slate-500 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-100"
                title={isSupprime ? "Supprimer définitivement" : "Supprimer"}
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input-field text-sm resize-none"
              rows={2}
              maxLength={1000}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => { setEditing(false); setEditContent(comment.contenu); }}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                <FiX size={12} /> Annuler
              </button>
              <button
                onClick={handleEdit}
                className="btn-primary text-xs !px-3 !py-1.5 flex items-center gap-1"
              >
                <FiCheck size={12} /> Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-[13px] sm:text-sm leading-relaxed pl-9 ${isSupprime ? 'text-slate-400 italic' : 'text-slate-700'}`}>
            {comment.contenu}
          </p>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-3 mt-3 pl-9">
          {isAuthenticated && !comment.parentId && (
            <button
              onClick={() => setReplying(!replying)}
              className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 hover:text-primary-600 transition-colors"
            >
              <FiMessageCircle size={12} />
              Répondre
            </button>
          )}
          {localReponseCount > 0 && !comment.parentId && (
            <button
              onClick={() => showReplies ? setShowReplies(false) : loadReplies()}
              className="text-[11px] sm:text-xs text-primary-600 hover:text-primary-700 transition-colors"
            >
              {showReplies ? 'Masquer' : `Voir ${localReponseCount} réponse(s)`}
            </button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {replying && (
        <div className="ml-4 sm:ml-8 mt-2">
          <form
            className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white pl-3 pr-1 py-1"
            onSubmit={(e) => {
              e.preventDefault();
              handleReply();
            }}
          >
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
              placeholder="Écrire une réponse..."
              className="flex-1 resize-none overflow-y-hidden bg-transparent text-sm outline-none min-h-[2.5rem] max-h-28 py-2"
              rows={2}
              maxLength={1000}
            />
            <div className="flex shrink-0 items-center gap-1 pb-1">
              <button type="button" onClick={() => setReplying(false)} className="btn-ghost text-xs !px-2 !py-1.5">
                Annuler
              </button>
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="p-2 rounded-full text-primary-600 hover:bg-primary-50 disabled:opacity-40"
                aria-label="Envoyer la réponse"
              >
                <FiSend size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-4 sm:ml-8 mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              annonceId={annonceId}
              onUpdated={onUpdated}
              onCommentPatched={handleReplyPatched}
              onCommentRemoved={handleReplyRemoved}
              onReplyThreadRefresh={onReplyThreadRefresh}
              compact={compact}
              bare={bare}
            />
          ))}
        </div>
      )}
    </div>
  );
}
