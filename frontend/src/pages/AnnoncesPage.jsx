import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiTag,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiLoader,
  FiRotateCcw,
} from 'react-icons/fi';
import { HiOutlineSpeakerphone } from 'react-icons/hi';
import AnnonceCard from '../components/annonces/AnnonceCard';
import AnnonceCommentsModal from '../components/annonces/AnnonceCommentsModal';
import AnnonceFormModal from '../components/annonces/AnnonceFormModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useAnnoncesModal } from '../context/AnnoncesModalContext';
import annonceService from '../services/annonceService';
import { parseAnnonceLiked } from '../utils/annonceLiked';

const TYPES = [
  { value: '', label: 'Tous' },
  { value: 'OFFRE', label: 'Offres' },
  { value: 'DEMANDE', label: 'Demandes' },
  { value: 'SERVICE', label: 'Services' },
  { value: 'AUTRE', label: 'Autres' },
];

const CATEGORIES = [
  { value: '', label: 'Toutes les categories' },
  { value: 'LIVRES_FOURNITURES', label: 'Livres & Fournitures' },
  { value: 'INFORMATIQUE', label: 'Informatique' },
  { value: 'LOGEMENT', label: 'Logement' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'COURS_SOUTIEN', label: 'Cours & Soutien' },
  { value: 'DIVERS', label: 'Divers' },
];

export default function AnnoncesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const { createOpen, closeCreateModal, openCreateModal } = useAnnoncesModal();

  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [statutFilter, setStatutFilter] = useState(''); // '' (Tous), 'ACTIF', 'SUPPRIME'
  const [commentsModalAnnonce, setCommentsModalAnnonce] = useState(null);
  const [editAnnonce, setEditAnnonce] = useState(null);
  const [deleteAnnonceTarget, setDeleteAnnonceTarget] = useState(null);
  const [deletingAnnonce, setDeletingAnnonce] = useState(false);
  const searchInputRef = useRef(null);
  const categoryRef = useRef(null);

  const patchAnnonce = useCallback((id, partial) => {
    setAnnonces((prev) => prev.map((a) => (a.id === id ? { ...a, ...partial } : a)));
    setCommentsModalAnnonce((prev) => (prev && prev.id === id ? { ...prev, ...partial } : prev));
  }, []);

  const removeAnnonce = useCallback((id) => {
    setAnnonces((prev) => prev.filter((a) => a.id !== id));
    setTotalElements((n) => Math.max(0, n - 1));
  }, []);

  const handleDeleteAnnonce = useCallback((annonce) => {
    if (!annonce?.id) return;
    setDeleteAnnonceTarget(annonce);
  }, []);

  const confirmDeleteAnnonce = useCallback(async () => {
    if (!deleteAnnonceTarget?.id || deletingAnnonce) return;
    setDeletingAnnonce(true);
    try {
      await annonceService.deleteAnnonce(deleteAnnonceTarget.id);
      removeAnnonce(deleteAnnonceTarget.id);
      if (commentsModalAnnonce?.id === deleteAnnonceTarget.id) {
        setCommentsModalAnnonce(null);
      }
      setDeleteAnnonceTarget(null);
    } catch (err) {
      console.error('delete annonce', err);
    } finally {
      setDeletingAnnonce(false);
    }
  }, [commentsModalAnnonce?.id, deleteAnnonceTarget?.id, deletingAnnonce, removeAnnonce]);

  const isAdei = useMemo(() => {
    return user?.roles?.some((r) => ['ADEI', 'ROLE_ADEI'].includes(String(r).toUpperCase()));
  }, [user]);

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreateModal();
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname, openCreateModal]);

  const fetchAnnonces = async () => {
    setLoading(true);
    try {
      const response = await annonceService.getAnnonces(currentPage, 12, statutFilter);

      let data = response.data.content || [];
      data = data.map((a) => ({ ...a, liked: parseAnnonceLiked(a) }));
      setAnnonces(data);
      setTotalPages(response.data.totalPages || 1);
      setTotalElements(response.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching annonces:', err);
      setAnnonces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAnnonces();
    }
  }, [currentPage, authLoading, isAuthenticated, statutFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  useEffect(() => {
    if (showSearch) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  useEffect(() => {
    if (!categoryOpen) return undefined;

    const handlePointerDown = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [categoryOpen]);

  const handleCreated = (created) => {
    const normalized = { ...created, liked: parseAnnonceLiked(created) };
    setAnnonces((prev) => [normalized, ...prev]);
    setTotalElements((n) => n + 1);
  };

  const filteredAnnonces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return annonces.filter((annonce) => {
      const matchesText = !query
        || String(annonce.titre || '').toLowerCase().includes(query)
        || String(annonce.description || '').toLowerCase().includes(query);
      const matchesType = !selectedType || annonce.type === selectedType;
      const matchesCategory = !selectedCategory || annonce.categorie?.code === selectedCategory;
      return matchesText && matchesType && matchesCategory;
    });
  }, [annonces, searchQuery, selectedCategory, selectedType]);

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
      <ConfirmModal
        open={Boolean(deleteAnnonceTarget)}
        title={deleteAnnonceTarget?.statut === 'SUPPRIME' ? "Supprimer définitivement ?" : "Supprimer l'annonce ?"}
        message={
          deleteAnnonceTarget?.statut === 'SUPPRIME'
            ? "Voulez-vous vraiment supprimer définitivement cette annonce de la base de données ? Cette action est irréversible."
            : "Voulez-vous vraiment supprimer cette annonce ? Elle sera masquée pour les utilisateurs."
        }
        confirmLabel={deletingAnnonce ? 'Suppression...' : (deleteAnnonceTarget?.statut === 'SUPPRIME' ? 'Supprimer définitivement' : 'Supprimer')}
        busy={deletingAnnonce}
        onConfirm={confirmDeleteAnnonce}
        onClose={() => (deletingAnnonce ? null : setDeleteAnnonceTarget(null))}
      />
      <AnnonceFormModal
        open={createOpen}
        onClose={closeCreateModal}
        mode="create"
        initialAnnonce={null}
        onSuccess={handleCreated}
      />
      <AnnonceFormModal
        open={Boolean(editAnnonce)}
        onClose={() => setEditAnnonce(null)}
        mode="edit"
        initialAnnonce={editAnnonce}
        onSuccess={(updated) => {
          patchAnnonce(updated.id, updated);
          if (commentsModalAnnonce?.id === updated.id) {
            setCommentsModalAnnonce((prev) => (prev ? { ...prev, ...updated } : prev));
          }
          setEditAnnonce(null);
        }}
      />
      <AnnonceCommentsModal
        open={Boolean(commentsModalAnnonce)}
        annonce={commentsModalAnnonce}
        onClose={() => setCommentsModalAnnonce(null)}
        onPatch={patchAnnonce}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-8 overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h1 className="text-[20px] sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <HiOutlineSpeakerphone className="text-primary-500" size={20} aria-hidden />
                  <span>Annonces</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <p className="text-slate-500 text-[10px] sm:text-xs font-medium tracking-wider">
                    {filteredAnnonces.length > 0
                      ? `${filteredAnnonces.length} Annonce${filteredAnnonces.length > 1 ? 's' : ''}`
                      : 'Explorez le campus'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSearch((v) => !v)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-center ${
                    showSearch
                      ? 'border-primary-300 bg-primary-50 text-primary-700 ring-4 ring-primary-500/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600 shadow-sm'
                  }`}
                  aria-label={showSearch ? 'Fermer la recherche' : 'Rechercher'}
                >
                  {showSearch ? <FiX size={18} /> : <FiSearch size={18} />}
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  id="create-annonce-btn"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center hover:scale-105 active:scale-95"
                  aria-label="Nouvelle annonce"
                >
                  <FiPlus size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Type Chips - Horizontal Scroll on Mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1 lg:mx-0 lg:px-0">
                {TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setSelectedType(type.value);
                      setCurrentPage(0);
                    }}
                    className={`shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[13px] sm:text-sm font-bold border transition-all duration-200 ${
                      selectedType === type.value
                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-auto">
                <div ref={categoryRef} className="relative flex-1 lg:w-64 lg:flex-none">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={categoryOpen}
                    onClick={() => setCategoryOpen((prev) => !prev)}
                    className={`h-12 w-full rounded-2xl border bg-white px-4 text-left transition-all duration-300 ${
                      categoryOpen
                        ? 'border-primary-400 ring-4 ring-primary-500/10 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <FiTag size={16} className={categoryOpen ? 'text-primary-500' : 'text-slate-400'} />
                        <span className={`truncate text-sm font-bold ${selectedCategory ? 'text-slate-900' : 'text-slate-500'}`}>
                          {CATEGORIES.find((cat) => cat.value === selectedCategory)?.label ?? 'Catégories'}
                        </span>
                      </span>
                      <FiChevronDown className={`shrink-0 text-slate-400 transition-transform duration-300 ${categoryOpen ? 'rotate-180' : ''}`} size={18} />
                    </span>
                  </button>

                  {categoryOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
                      <ul role="listbox" className="max-h-72 overflow-y-auto py-1.5">
                        {CATEGORIES.map((category) => {
                          const isSelected = selectedCategory === category.value;
                          return (
                            <li key={category.value}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedCategory(category.value);
                                  setCurrentPage(0);
                                  setCategoryOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                  isSelected ? 'bg-primary-50 text-primary-900' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="truncate text-sm font-medium">{category.label}</span>
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                    isSelected
                                      ? 'border-primary-200 bg-primary-100 text-primary-700'
                                      : 'border-slate-200 bg-white text-transparent'
                                  }`}
                                >
                                  <FiCheck size={14} />
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {(selectedType || selectedCategory) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('');
                      setSelectedCategory('');
                      setCategoryOpen(false);
                      setCurrentPage(0);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/50 px-6 text-sm font-bold text-red-600 transition-all hover:bg-red-50 hover:text-red-700 active:scale-95"
                  >
                    <FiRotateCcw size={16} />
                    <span className="lg:hidden xl:inline">Réinitialiser</span>
                    <span className="hidden lg:inline xl:hidden">Reset</span>
                  </button>
                )}

                {isAdei && (
                  <div className="flex w-full items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/80 p-1 sm:w-auto">
                    {[
                      { value: '', label: 'Tous' },
                      { value: 'ACTIF', label: 'Actifs' },
                      { value: 'SUPPRIME', label: 'Supprimés' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setStatutFilter(s.value);
                          setCurrentPage(0);
                        }}
                        className={`flex-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 sm:flex-none ${
                          statutFilter === s.value
                            ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200/50'
                            : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showSearch && (
              <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                    <FiSearch size={20} />
                  </div>
                  <input
                    ref={searchInputRef}
                    id="search-annonces"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                    placeholder="Rechercher par titre, description..."
                    className="w-full h-11 sm:h-14 pl-12 pr-12 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/30 text-[13px] sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all duration-300"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(0);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                      aria-label="Effacer la recherche"
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <FiLoader className="animate-spin text-primary-400" size={32} />
              <p className="text-slate-500 text-sm">Chargement des annonces...</p>
            </div>
          </div>
        ) : filteredAnnonces.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAnnonces.map((annonce) => (
                <AnnonceCard
                  key={annonce.id}
                  annonce={annonce}
                  onOpenComments={setCommentsModalAnnonce}
                  onLikeChange={patchAnnonce}
                  onEdit={setEditAnnonce}
                  onDelete={handleDeleteAnnonce}
                  showOwnerActions
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center">
                <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    id="pagination-first"
                    className="btn-secondary !px-3 !py-2 disabled:opacity-30"
                    title="Premier"
                    aria-label="Premier"
                  >
                    <FiChevronsLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    id="pagination-prev"
                    className="btn-secondary !px-3 !py-2 disabled:opacity-30"
                    title="Précédent"
                    aria-label="Précédent"
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                            pageNum === currentPage
                              ? 'bg-primary-500 text-white shadow-glow-primary'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    id="pagination-next"
                    className="btn-secondary !px-3 !py-2 disabled:opacity-30"
                    title="Suivant"
                    aria-label="Suivant"
                  >
                    <FiChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    id="pagination-last"
                    className="btn-secondary !px-3 !py-2 disabled:opacity-30"
                    title="Dernier"
                    aria-label="Dernier"
                  >
                    <FiChevronsRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-6">
              <HiOutlineSpeakerphone className="text-slate-400 sm:text-slate-500" size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Aucune annonce trouvée</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}". Essayez avec d'autres mots-clés.`
                : "Il n'y a pas encore d'annonces publiées. Soyez le premier !"}
            </p>
            <button 
              type="button" 
              onClick={openCreateModal} 
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <FiPlus size={16} />
              Publier une annonce
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
