import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiCornerDownRight } from 'react-icons/fi';
import CommentItem from './CommentItem';
import commentaireService from '../../services/commentaireService';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({
  annonceId,
  comments,
  onCommentAdded,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
  onReplyThreadRefresh,
  compact,
  hideComposer,
  hideSectionTitle,
  bareComments,
}) {
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await commentaireService.addCommentaire({
        contenu: newComment.trim(),
        annonceId: annonceId,
        parentId: null,
      });
      setNewComment('');
      if (onCommentCreated) {
        onCommentCreated(res.data);
      } else if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const wrapperClass = compact ? 'mt-0' : 'mt-8';
  const titleClass = compact
    ? 'text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2'
    : 'text-xl font-bold text-slate-900 mb-6 flex items-center gap-2';

  return (
    <div id="comment-section" className={wrapperClass}>
      {!hideSectionTitle && (
        <h3 className={titleClass}>
          <FiCornerDownRight className={compact ? 'text-primary-500' : 'text-primary-600'} size={compact ? 14 : 18} />
          Commentaires
          {comments && (
            <span className={compact ? 'text-xs font-normal text-slate-500' : 'text-sm font-normal text-slate-500'}>
              ({comments.length})
            </span>
          )}
        </h3>
      )}

      {!hideComposer &&
        (isAuthenticated ? (
          <form onSubmit={handleSubmit} className={compact ? 'mb-4' : 'mb-8'}>
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  id="comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  rows={compact ? 2 : 3}
                  maxLength={1000}
                  className="input-field resize-none text-sm"
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">{newComment.length}/1000</span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                id="submit-comment-btn"
                className="btn-primary text-sm !px-4 !py-2 flex items-center gap-2"
              >
                <FiSend size={14} />
                {submitting ? 'Envoi...' : 'Commenter'}
              </button>
            </div>
          </form>
        ) : (
          <div className={`glass rounded-xl ${compact ? 'p-3 mb-4' : 'p-4 mb-8'} text-center`}>
            <p className="text-slate-600 text-sm">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 underline">
                Connectez-vous
              </Link>{' '}
              pour laisser un commentaire.
            </p>
          </div>
        ))}

      <div className={bareComments ? 'space-y-0' : compact ? 'space-y-2' : 'space-y-4'}>
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              annonceId={annonceId}
              onUpdated={onCommentAdded}
              onCommentPatched={onCommentUpdated}
              onCommentRemoved={onCommentDeleted}
              onReplyThreadRefresh={onReplyThreadRefresh}
              compact={compact}
              bare={bareComments}
            />
          ))
        ) : (
          <div className={`text-center ${compact ? 'py-4' : 'py-8'}`}>
            <p className="text-slate-500 text-sm">Aucun commentaire pour le moment. Soyez le premier !</p>
          </div>
        )}
      </div>
    </div>
  );
}
