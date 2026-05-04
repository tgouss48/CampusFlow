import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  confirmVariant = 'danger',
  busy,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const confirmClassName =
    confirmVariant === 'danger'
      ? 'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40'
      : 'btn-primary text-sm !px-4 !py-2.5 disabled:opacity-40';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
        disabled={busy}
      />

      <div className="relative w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-3 top-3 rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          aria-label="Fermer"
        >
          <FiX size={18} />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="text-red-600" size={24} aria-hidden />
            </div>
            <div className="min-w-0 pr-0 sm:pr-4">
              <h2 id="confirm-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 leading-tight tracking-tight">
                {title || 'Confirmer la suppression'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed font-medium">
                {message || 'Cette action est irréversible. Veuillez confirmer votre choix.'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="w-full sm:w-auto btn-secondary text-sm !px-6 !py-3 disabled:opacity-40"
            >
              {cancelLabel}
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              disabled={busy} 
              className={`w-full sm:w-auto ${confirmClassName}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

