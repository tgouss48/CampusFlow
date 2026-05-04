import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiSend } from 'react-icons/fi';
import CommentSection from './CommentSection';
import AnnonceCard from './AnnonceCard';
import { useAuth } from '../../context/AuthContext';
import commentaireService from '../../services/commentaireService';
import { parseAnnonceLiked } from '../../utils/annonceLiked';

export default function AnnonceCommentsModal({ open, annonce, onClose, onPatch }) {
  const { user, isAuthenticated } = useAuth();
  const [full, setFull] = useState(null);
  const [comments, setComments] = useState([]);
  const [quickComment, setQuickComment] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const annonceId = annonce?.id;

  const countDisplayedComments = useCallback((list) => {
    return list.reduce(
      (total, comment) => total + 1 + (Number(comment.reponseCount) || 0),
      0,
    );
  }, []);

  const fetchComments = useCallback(async () => {
    if (!annonceId) return;
    try {
      const res = await commentaireService.getCommentaires(annonceId, 0, 100);
      const list = res.data.content || [];
      setComments(list);
      const total = countDisplayedComments(list);
      setFull((prev) => (prev ? { ...prev, commentaireCount: total } : prev));
      onPatch?.(annonceId, { commentaireCount: total });
    } catch (err) {
      console.error('fetchComments', err);
    }
  }, [annonceId, countDisplayedComments, onPatch]);

  useEffect(() => {
    if (!open || !annonceId) {
      setFull(null);
      setComments([]);
      setQuickComment('');
      return;
    }
    setFull(annonce);
  }, [open, annonceId, annonce]);

  useEffect(() => {
    if (!open || !annonceId) {
      return;
    }
    fetchComments();
  }, [open, annonceId, fetchComments]);

  if (!open || !annonce) return null;

  const display = full || annonce;

  const handleQuickComment = async (e) => {
    e.preventDefault();
    if (!quickComment.trim() || quickSubmitting || !annonceId) return;
    setQuickSubmitting(true);
    try {
      const res = await commentaireService.addCommentaire({
        contenu: quickComment.trim(),
        annonceId: Number(annonceId),
        parentId: null,
      });
      setQuickComment('');
      setComments((prev) => (prev.some((x) => x.id === res.data.id) ? prev : [...prev, res.data]));
      const base = full || annonce;
      const next = (base.commentaireCount ?? 0) + 1;
      setFull({ ...base, commentaireCount: next });
      onPatch?.(annonceId, { commentaireCount: next });
    } catch (err) {
      console.error('quick comment', err);
    } finally {
      setQuickSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comments-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-5xl sm:rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-600 hover:bg-slate-50 shadow-md transition-all active:scale-95"
          aria-label="Fermer"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-1 flex-col min-h-0 overflow-y-auto bg-slate-50/60 md:overflow-hidden md:flex-row">
          {/* Left/Top Section: Annonce Info */}
          <div className="shrink-0 border-b border-slate-200 bg-white md:w-[min(480px,50%)] md:max-h-full md:border-b-0 md:border-r md:overflow-y-auto">
            <div className="px-4 py-4 sm:px-6 sm:py-6">
              <AnnonceCard
                annonce={{
                  ...display,
                  liked: parseAnnonceLiked(display),
                }}
                plain
                onOpenComments={undefined}
                onLikeChange={(id, patch) => {
                  setFull((f) => (f ? { ...f, ...patch } : f));
                  onPatch?.(id, patch);
                }}
              />
            </div>
          </div>

          {/* Right/Bottom Section: Comments Section */}
          <div className="flex flex-1 flex-col min-h-0 bg-white md:max-h-full">
            <div id="comments-modal-title" className="hidden shrink-0 border-b border-slate-100 px-6 py-4 md:flex items-center">
              <h3 className="text-lg font-bold text-slate-800">Commentaires</h3>
            </div>

            <div className="flex-1 min-h-0 px-3 py-3 md:overflow-y-auto md:px-6 md:py-6">
              <CommentSection
                annonceId={Number(annonceId)}
                comments={comments}
                hideComposer
                hideSectionTitle
                bareComments
                compact
                onCommentCreated={(c) => {
                  setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
                  const base = full || annonce;
                  const next = (base.commentaireCount ?? 0) + 1;
                  setFull({ ...base, commentaireCount: next });
                  onPatch?.(annonceId, { commentaireCount: next });
                }}
                onCommentUpdated={(c) => setComments((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
                onCommentDeleted={async (commentId) => {
                  setComments((prev) => prev.filter((x) => x.id !== commentId));
                  try {
                    const res = await commentaireService.getCommentaires(annonceId, 0, 100);
                    const list = res.data.content || [];
                    setComments(list);
                    const total = countDisplayedComments(list);
                    const base = full || annonce;
                    setFull({ ...base, commentaireCount: total });
                    onPatch?.(annonceId, { commentaireCount: total });
                  } catch (err) {
                    console.error('refresh comments', err);
                  }
                }}
                onReplyThreadRefresh={fetchComments}
              />
            </div>
          </div>
        </div>

        {/* Footer: Quick Comment Input */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-6 sm:pb-4">
          {isAuthenticated ? (
            <form
              onSubmit={handleQuickComment}
              className="flex items-end gap-2 rounded-[28px] border border-slate-200 bg-slate-50/90 pl-4 pr-1 py-1 shadow-sm"
            >
              <textarea
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickComment(e);
                  }
                }}
                disabled={annonce.statut === 'SUPPRIME' || quickSubmitting}
                placeholder={annonce.statut === 'SUPPRIME' ? "Annonce supprimée, commentaires fermés" : "Ajouter un commentaire…"}
                maxLength={1000}
                rows={1}
                className={`min-w-0 flex-1 resize-none overflow-y-hidden bg-transparent py-2.5 text-sm outline-none ${annonce.statut === 'SUPPRIME' ? 'cursor-not-allowed italic' : ''}`}
              />
              <button
                type="submit"
                disabled={!quickComment.trim() || quickSubmitting || annonce.statut === 'SUPPRIME'}
                className="shrink-0 rounded-full p-2.5 text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Envoyer le commentaire"
              >
                <FiSend size={20} />
              </button>
            </form>
          ) : (
            <p className="py-1 text-center text-sm text-slate-600">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 underline">
                Connectez-vous
              </Link>{' '}
              pour commenter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
