import { useMemo } from 'react';
import { FiCalendar, FiEdit2, FiMapPin, FiTrash2, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const STATUS_META = {
  A_VENIR: {
    label: 'A venir',
    badgeClass: 'bg-cyan-50 text-cyan-900 border border-cyan-200',
    accentClass: 'from-violet-500 via-indigo-400 to-cyan-300',
    actionClass: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    actionLabel: 'Participer',
  },
  EN_COURS: {
    label: 'En cours',
    badgeClass: 'bg-amber-50 text-amber-900 border border-amber-200',
    accentClass: 'from-emerald-400 via-green-400 to-teal-300',
    actionClass: 'bg-orange-100 text-orange-900 hover:bg-orange-200',
    actionLabel: 'Se desinscrire',
  },
  COMPLET: {
    label: 'Complet',
    badgeClass: 'bg-rose-50 text-rose-900 border border-rose-200',
    accentClass: 'from-orange-500 via-red-400 to-rose-300',
    actionClass: 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200',
    actionLabel: 'Complet',
  },
  PASSE: {
    label: 'Passe',
    badgeClass: 'bg-stone-100 text-stone-700 border border-stone-300',
    accentClass: 'from-zinc-500 via-zinc-400 to-stone-300',
    actionClass: 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200',
    actionLabel: 'Termine',
  },
};

function normalizeStatus(evenement) {
  const raw = String(evenement.displayStatus || evenement.statut || '').toUpperCase();
  if (['A_VENIR', 'A VENIR', 'UPCOMING', 'PUBLIE'].includes(raw)) return 'A_VENIR';
  if (['EN_COURS', 'EN COURS', 'ONGOING'].includes(raw)) return 'EN_COURS';
  if (['COMPLET', 'FULL'].includes(raw)) return 'COMPLET';
  if (['PASSE', 'PASSÉ', 'PASSEE', 'TERMINE', 'TERMINÉ', 'TERMINATED'].includes(raw)) return 'PASSE';
  return 'A_VENIR';
}

function formatShortDate(date) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: '2-digit',
  }).format(target);
}

function formatTimeRange(dateDebut, dateFin) {
  const start = new Date(dateDebut);
  const end = dateFin ? new Date(dateFin) : null;
  if (Number.isNaN(start.getTime())) return '';

  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const startText = timeFormatter.format(start).replace(':', 'h');
  if (!end || Number.isNaN(end.getTime())) {
    return `${formatShortDate(start)} - ${startText}`;
  }

  const endText = timeFormatter.format(end).replace(':', 'h');
  return `${formatShortDate(start)} - ${startText} -> ${formatShortDate(end)} - ${endText}`;
}

function buildParticipantSummary(evenement, statusKey) {
  const count = Number(evenement.nombreParticipants ?? 0);
  const max = evenement.capaciteMax;

  if (statusKey === 'COMPLET' && max) {
    return `${count}/${max} - complet`;
  }

  if (max) {
    return `${count} / ${max} places`;
  }

  return `${count} participant${count > 1 ? 's' : ''}`;
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

function shouldShowDetailsCta(description = '') {
  return String(description).trim().length > 110;
}

export default function EvenementCard({
  evenement,
  showFullDescription = false,
  onOpenDetails,
  onOpenParticipants,
  onToggleParticipation,
  onEdit,
  onDelete,
  busy = false,
  canParticipate = true,
  canManage = false,
}) {
  const statusKey = normalizeStatus(evenement);
  const meta = STATUS_META[statusKey];
  const participants = evenement.previewParticipants || [];
  const summary = buildParticipantSummary(evenement, statusKey);
  const hasJoined = Boolean(evenement.isParticipating);
  const actionLabel = hasJoined ? 'Se desinscrire' : meta.actionLabel;
  const actionClass = hasJoined
    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
    : meta.actionClass;
  const disabled = busy || statusKey === 'PASSE' || (!hasJoined && statusKey === 'COMPLET');
  const showDetailsCta = shouldShowDetailsCta(evenement.description);
  const { user, isAuthenticated } = useAuth();

  const { isOwner, isAdei } = useMemo(() => {
    if (!isAuthenticated || !user || !evenement) return { isOwner: false, isAdei: false };
    
    const uid = String(user.id || user.userId || '');
    if (!uid) return { isOwner: false, isAdei: false };

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const adei = roles.some(r => ['ADEI', 'ROLE_ADEI'].includes(String(r).toUpperCase())) || 
                 ['ADEI', 'ROLE_ADEI'].includes(String(user.role).toUpperCase());
    
    const ownerId = String(evenement.organisateurId || evenement.organisateur?.id || '');
    
    return { isOwner: uid === ownerId, isAdei: adei };
  }, [isAuthenticated, user, evenement]);

  const handleActionClick = (event, handler) => {
    event.stopPropagation();
    handler?.(evenement);
  };

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`h-1.5 w-full rounded-t-[24px] bg-gradient-to-r ${meta.accentClass}`} />

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[17px] sm:text-xl font-bold text-slate-900 leading-tight flex-1 min-w-0">
              {evenement.titre}
            </h3>
            <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[13px] font-semibold ${meta.badgeClass}`}>
              {meta.label}
            </span>
          </div>

          <div className="space-y-2 text-slate-500">
            <div className="flex items-start gap-2 text-[13px] sm:text-sm">
              <FiCalendar className="mt-0.5 shrink-0 text-slate-400" size={15} />
              <span className="leading-tight">{formatTimeRange(evenement.dateDebut, evenement.dateFin)}</span>
            </div>

            <div className="flex items-center gap-2 text-[13px] sm:text-sm">
              <FiMapPin className="shrink-0 text-slate-400" size={15} />
              <span className="truncate">{evenement.lieu || 'Lieu a confirmer'}</span>
            </div>
          </div>

          {evenement.description && (
            <div className="mt-1 max-w-2xl rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-primary-400 to-cyan-300" />
                <div className="min-w-0">
                  <p className={`text-[13px] sm:text-sm leading-6 text-slate-600 break-words ${showFullDescription ? '' : 'line-clamp-2'}`}>
                    {evenement.description}
                  </p>
                  {!showFullDescription && showDetailsCta && (
                    <button
                      type="button"
                      onClick={(event) => handleActionClick(event, onOpenDetails)}
                      className="mt-1 inline-flex text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
                    >
                      Voir plus
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            {participants.length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  if (!canManage) return;
                  handleActionClick(event, onOpenParticipants);
                }}
                disabled={!canManage}
                className={`flex items-center text-left ${canManage ? 'transition-opacity hover:opacity-80' : ''}`}
                title={canManage ? 'Voir les participants' : undefined}
              >
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((participant, index) => (
                    <div
                      key={participant.id || participant.participantId || participant.name}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm ${avatarPalette(index)}`}
                      title={participant.name}
                    >
                      {initialsFromName(participant.name) || 'U'}
                    </div>
                  ))}
                </div>
                <span
                  className={`ml-3 text-[13px] sm:text-sm font-semibold ${
                    statusKey === 'COMPLET' ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {summary}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  if (!canManage) return;
                  handleActionClick(event, onOpenParticipants);
                }}
                disabled={!canManage}
                className={`flex items-center gap-2 text-slate-500 ${canManage ? 'transition-opacity hover:opacity-80' : ''}`}
                title={canManage ? 'Voir les participants' : undefined}
              >
                <FiUsers size={16} className="text-slate-400" />
                <span className={`text-[13px] sm:text-sm font-semibold ${statusKey === 'COMPLET' ? 'text-rose-600' : 'text-slate-700'}`}>
                  {summary}
                </span>
              </button>
            )}
          </div>

          {isOwner || isAdei ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onEdit)}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                aria-label="Modifier l'evenement"
                title="Modifier"
              >
                <FiEdit2 size={15} />
              </button>
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onDelete)}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition-all hover:-translate-y-0.5 hover:bg-red-100 shadow-sm"
                aria-label="Supprimer l'evenement"
                title="Supprimer"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          ) : canParticipate ? (
            <button
              type="button"
              onClick={(event) => handleActionClick(event, onToggleParticipation)}
              disabled={disabled}
              className={`inline-flex min-w-[130px] sm:min-w-[150px] items-center justify-center rounded-xl px-4 py-2 sm:py-2.5 text-[13px] sm:text-sm font-semibold transition-all ${
                disabled
                  ? actionClass
                  : `${actionClass} border border-transparent shadow-sm hover:-translate-y-0.5`
              }`}
            >
              {busy ? 'Chargement...' : actionLabel}
            </button>
          ) : (
            <div className="inline-flex min-w-[150px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400">
              Organisateur
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
