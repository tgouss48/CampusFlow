import { FiClock, FiUser, FiUsers, FiX } from 'react-icons/fi';

function formatParticipationDate(value) {
  if (!value) return 'Date indisponible';

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'Date indisponible';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(target);
}

function initialsFromName(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function avatarPalette(index = 0) {
  const palettes = [
    'bg-violet-50 text-violet-700 border-violet-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-sky-50 text-sky-700 border-sky-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-indigo-50 text-indigo-700 border-indigo-100',
  ];
  return palettes[index % palettes.length];
}

export default function EvenementParticipantsModal({
  open,
  evenement,
  participants = [],
  loading = false,
  onClose,
}) {
  if (!open || !evenement) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evenement-participants-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-t-[28px] sm:rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div id="evenement-participants-title" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
              <FiUsers className="text-primary-500" size={18} />
              <span>Participants</span>
            </div>
            <p className="mt-1 truncate text-[13px] sm:text-sm text-slate-500">
              {evenement.titre}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fermer"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 pb-8 sm:px-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Chargement des participants...
            </div>
          ) : participants.length > 0 ? (
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={participant.id ?? participant.participantId}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-bold shadow-sm ${avatarPalette(index)}`}>
                      {initialsFromName(participant.participantDisplayName || `Participant ${participant.participantId}`) || <FiUser size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] sm:text-sm font-semibold text-slate-900">
                        {participant.participantDisplayName || `Participant #${participant.participantId}`}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                        <FiClock size={12} />
                        <span>Inscrit le {formatParticipationDate(participant.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <FiUsers size={28} />
              </div>
              <p className="text-base font-semibold text-slate-900">Aucun participant</p>
              <p className="mt-1 text-sm text-slate-500">
                Cet evenement n&apos;a encore aucune inscription.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
