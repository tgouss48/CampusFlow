import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiCalendar, FiLoader, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import ConfirmModal from '../components/common/ConfirmModal';
import EvenementCard from '../components/evenements/EvenementCard';
import EvenementDetailsModal from '../components/evenements/EvenementDetailsModal';
import EvenementFormModal from '../components/evenements/EvenementFormModal';
import EvenementParticipantsModal from '../components/evenements/EvenementParticipantsModal';
import { useAuth } from '../context/AuthContext';
import evenementService from '../services/evenementService';

const FILTERS = [
  { value: 'ALL', label: 'Tous' },
  { value: 'A_VENIR', label: 'A venir' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'COMPLET', label: 'Complets' },
];

function normalizeEvent(raw) {
  const hasExplicitIsParticipating = typeof raw?.isParticipating === 'boolean';
  const hasExplicitParticipating = typeof raw?.participating === 'boolean';

  return {
    ...raw,
    displayStatus: raw.displayStatus || null,
    isParticipating: hasExplicitIsParticipating
      ? raw.isParticipating
      : hasExplicitParticipating
        ? raw.participating
        : false,
    previewParticipants: raw.previewParticipants || [],
  };
}

function normalizeStatusKey(value) {
  const raw = String(value || '').trim().toUpperCase();

  if (['A_VENIR', 'A VENIR', 'UPCOMING'].includes(raw)) return 'A_VENIR';
  if (['EN_COURS', 'EN COURS', 'ONGOING'].includes(raw)) return 'EN_COURS';
  if (['COMPLET', 'FULL'].includes(raw)) return 'COMPLET';
  if (['PASSE', 'PASSEE', 'PAST', 'TERMINE', 'TERMINEE'].includes(raw)) return 'PASSE';
  return null;
}

function deriveDisplayStatus(event) {
  const explicitStatus = normalizeStatusKey(event.displayStatus);
  if (explicitStatus) return explicitStatus;

  const now = new Date();
  const start = event.dateDebut ? new Date(event.dateDebut) : null;
  const end = event.dateFin ? new Date(event.dateFin) : null;
  const isFull = event.capaciteMax && Number(event.nombreParticipants) >= Number(event.capaciteMax);
  const backendStatus = normalizeStatusKey(event.statut);

  if (backendStatus === 'PASSE') return 'PASSE';
  if (isFull) return 'COMPLET';
  if (backendStatus === 'EN_COURS') return 'EN_COURS';
  if (backendStatus === 'A_VENIR') return 'A_VENIR';
  if (start && end && start <= now && end >= now) return 'EN_COURS';
  if (end && end < now) return 'PASSE';
  return 'A_VENIR';
}

function normalizeAndDecorateEvent(raw) {
  const normalized = normalizeEvent(raw);
  return {
    ...normalized,
    displayStatus: deriveDisplayStatus(normalized),
  };
}

export default function EvenementsPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [busyEventId, setBusyEventId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [participantsEvent, setParticipantsEvent] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const isAdei = useMemo(() => {
    const roleValues = [
      ...(Array.isArray(user?.roles) ? user.roles : []),
      ...(typeof user?.role === 'string' ? [user.role] : []),
    ]
      .map((value) => String(value).trim().toUpperCase())
      .filter(Boolean);

    return roleValues.includes('ADEI') || roleValues.includes('ROLE_ADEI');
  }, [user]);

  const loadEvenements = useCallback(async ({ silent = false } = {}) => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    setError('');

    try {
      const response = await evenementService.getEvenements(0, 12);
      const content = response.data?.content || [];
      setEvenements(content.map(normalizeAndDecorateEvent));
    } catch (requestError) {
      console.error('fetch evenements', requestError);
      if (!silent) {
        setEvenements([]);
        setError("Impossible de charger les evenements pour l'instant.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (showSearch) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  useEffect(() => {
    const targetEventId = location.state?.openEventId;
    if (!targetEventId || evenements.length === 0) {
      return;
    }

    const matched = evenements.find((event) => Number(event.id) === Number(targetEventId));
    if (matched) {
      setDetailsEvent(matched);
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // Si l'événement n'est pas dans la liste (ex: page suivante), on va le chercher
      const fetchAndOpen = async () => {
        try {
          const response = await evenementService.getEvenement(targetEventId);
          if (response.data) {
            setDetailsEvent(normalizeAndDecorateEvent(response.data));
            navigate(location.pathname, { replace: true, state: {} });
          }
        } catch (err) {
          console.error("Erreur lors de la récupération de l'événement cible", err);
        }
      };
      fetchAndOpen();
    }
  }, [evenements, location.pathname, location.state, navigate]);

  useEffect(() => {
    loadEvenements();
  }, [loadEvenements]);

  useEffect(() => {
    if (!isAdei) {
      setCreateOpen(false);
      setEditingEvent(null);
    }
  }, [isAdei]);

  const filteredEvenements = useMemo(() => {
    return evenements.filter((event) => {
      if (event.displayStatus === 'PASSE') {
        return false;
      }

      const matchesFilter = selectedFilter === 'ALL' || event.displayStatus === selectedFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        String(event.titre || '').toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [evenements, searchQuery, selectedFilter]);

  const patchEventLocally = (eventId, updater) => {
    setEvenements((prev) =>
      prev.map((item) => {
        if (item.id !== eventId) return item;
        return updater(item);
      })
    );

    setDetailsEvent((current) => {
      if (!current || current.id !== eventId) return current;
      return updater(current);
    });
  };

  const handleToggleParticipation = async (event) => {
    if (!event?.id || busyEventId) return;

    const previousEvent = { ...event };
    const optimisticState = {
      ...previousEvent,
      isParticipating: !Boolean(previousEvent.isParticipating),
      nombreParticipants: Math.max(
        0,
        Number(previousEvent.nombreParticipants ?? 0) + (previousEvent.isParticipating ? -1 : 1)
      ),
    };
    const optimisticEvent = normalizeAndDecorateEvent(optimisticState);

    setBusyEventId(event.id);
    patchEventLocally(event.id, () => optimisticEvent);

    try {
      const response = await evenementService.toggleParticipation(event.id);
      const payload = response.data;
      const confirmedEvent = normalizeAndDecorateEvent({
        ...optimisticEvent,
        isParticipating: Boolean(payload?.participating),
        nombreParticipants: Number(payload?.nombreParticipants ?? optimisticEvent.nombreParticipants),
      });
      patchEventLocally(event.id, () => confirmedEvent);
      await loadEvenements({ silent: true });
    } catch (error) {
      console.error('toggle participation', error);
      patchEventLocally(event.id, () => normalizeAndDecorateEvent(previousEvent));
    } finally {
      setBusyEventId(null);
    }
  };

  const handleCreated = (createdEvent) => {
    setEvenements((prev) => [normalizeAndDecorateEvent(createdEvent), ...prev]);
    setError('');
  };

  const handleUpdated = (updatedEvent) => {
    setEvenements((prev) =>
      prev.map((item) => (item.id === updatedEvent.id ? normalizeAndDecorateEvent(updatedEvent) : item))
    );
    setError('');
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id || deleteBusy) return;

    setDeleteBusy(true);
    try {
      await evenementService.deleteEvenement(deleteTarget.id);
      setEvenements((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (detailsEvent?.id === deleteTarget.id) {
        setDetailsEvent(null);
      }
      if (participantsEvent?.id === deleteTarget.id) {
        setParticipantsEvent(null);
        setParticipantsList([]);
      }
      setDeleteTarget(null);
      setError('');
    } catch (err) {
      console.error('delete evenement', err);
      setError(err.response?.data?.message || "Impossible de supprimer l'evenement.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleOpenParticipants = async (event) => {
    if (!event?.id || !isAdei) return;

    setParticipantsEvent(event);
    setParticipantsList([]);
    setParticipantsLoading(true);

    try {
      const response = await evenementService.getParticipants(event.id);
      setParticipantsList(response.data || []);
    } catch (requestError) {
      console.error('fetch participants', requestError);
      setParticipantsList([]);
      setError("Impossible de charger les participants pour l'instant.");
    } finally {
      setParticipantsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-24">
        <FiLoader className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-10">
      {isAdei && (
        <EvenementFormModal
          open={createOpen}
          mode="create"
          initialEvenement={null}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreated}
        />
      )}
      {isAdei && (
        <EvenementFormModal
          open={Boolean(editingEvent)}
          mode="edit"
          initialEvenement={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={handleUpdated}
        />
      )}
      <EvenementDetailsModal
        open={Boolean(detailsEvent)}
        evenement={detailsEvent}
        busy={detailsEvent ? busyEventId === detailsEvent.id : false}
        canParticipate={!isAdei}
        canManage={isAdei}
        onClose={() => setDetailsEvent(null)}
        onOpenParticipants={handleOpenParticipants}
        onToggleParticipation={handleToggleParticipation}
        onEdit={(event) => {
          setDetailsEvent(null);
          setEditingEvent(event);
        }}
        onDelete={(event) => {
          setDetailsEvent(null);
          setDeleteTarget(event);
        }}
      />
      <EvenementParticipantsModal
        open={Boolean(participantsEvent)}
        evenement={participantsEvent}
        participants={participantsList}
        loading={participantsLoading}
        onClose={() => {
          setParticipantsEvent(null);
          setParticipantsList([]);
        }}
      />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer l'événement ?"
        message="Voulez-vous vraiment supprimer cet événement ? Cette action est définitive et toutes les inscriptions seront annulées."
        confirmLabel={deleteBusy ? 'Suppression...' : 'Supprimer'}
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleteBusy) {
            setDeleteTarget(null);
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-4 sm:mb-8">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
              <div className="min-w-0">
                <h1 className="text-[20px] sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FiCalendar className="text-primary-500" size={20} aria-hidden />
                  <span>Événements</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <p className="text-slate-500 text-[10px] sm:text-xs font-medium tracking-wider">
                    {filteredEvenements.length > 0
                      ? `${filteredEvenements.length} Événement${filteredEvenements.length > 1 ? 's' : ''}`
                      : 'Découvrez le campus'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSearch((value) => !value)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-center ${
                    showSearch
                      ? 'border-primary-300 bg-primary-50 text-primary-700 ring-4 ring-primary-500/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600 shadow-sm'
                  }`}
                  aria-label={showSearch ? 'Fermer la recherche' : 'Rechercher'}
                >
                  {showSearch ? <FiX size={18} /> : <FiSearch size={18} />}
                </button>

                {isAdei && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
                    title="Ajouter un événement"
                    aria-label="Ajouter un événement"
                  >
                    <FiPlus size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Type Chips - Horizontal Scroll on Mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[13px] sm:text-sm font-bold border transition-all duration-200 ${
                    selectedFilter === filter.value
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {showSearch && (
              <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <FiSearch size={20} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par titre..."
                    className="w-full h-11 sm:h-14 pl-12 pr-12 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/30 text-[13px] sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all duration-300"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                      aria-label="Effacer la recherche"
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && !loading && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <FiLoader className="animate-spin text-primary-400" size={32} />
              <p className="text-slate-500 text-sm">Chargement des evenements...</p>
            </div>
          </div>
        ) : filteredEvenements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvenements.map((evenement) => (
              <EvenementCard
                key={evenement.id}
                evenement={evenement}
                busy={busyEventId === evenement.id}
                canParticipate={!isAdei}
                canManage={isAdei}
                onOpenDetails={setDetailsEvent}
                onOpenParticipants={handleOpenParticipants}
                onEdit={setEditingEvent}
                onDelete={setDeleteTarget}
                onToggleParticipation={handleToggleParticipation}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-6">
              <FiCalendar className="text-slate-400 sm:text-slate-500" size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}". Essayez avec un autre mot-clé.`
                : "Il n'y a pas encore d'événements affichés pour ce filtre."}
            </p>
            {isAdei && !searchQuery && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <FiPlus size={16} />
                Créer un événement
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
