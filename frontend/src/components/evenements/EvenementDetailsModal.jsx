import { FiX } from 'react-icons/fi';
import EvenementCard from './EvenementCard';

export default function EvenementDetailsModal({
  open,
  evenement,
  canParticipate = true,
  canManage = false,
  busy = false,
  onClose,
  onOpenParticipants,
  onToggleParticipation,
  onEdit,
  onDelete,
}) {
  if (!open || !evenement) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Bouton de fermeture flottant à l'extérieur */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-16 right-4 sm:-right-12 sm:top-0 z-[90] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
          aria-label="Fermer"
        >
          <FiX size={22} />
        </button>

        <div className="relative bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl overflow-hidden">
          <div className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div id="evenement-details-title" className="sr-only">
              Détails de l'événement
            </div>

            <div className="p-3 sm:p-5">
            <EvenementCard
              evenement={evenement}
              showFullDescription
              busy={busy}
              canParticipate={canParticipate}
              canManage={canManage}
              onOpenParticipants={onOpenParticipants}
              onToggleParticipation={onToggleParticipation}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
