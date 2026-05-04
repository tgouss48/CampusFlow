import { useEffect, useState, useRef, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FiLoader, FiShield, FiSlash, FiUnlock, FiSearch, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { listUsers, updateUserAccess } from '../services/authService';

export default function UserAccessManagementPage() {
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pageError, setPageError] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (showSearch) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  const isAdei = user?.role === 'ADEI' || user?.roles?.includes('ADEI');

  useEffect(() => {
    if (!isAuthenticated || !isAdei) {
      return;
    }

    let active = true;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      setPageError('');

      try {
        const response = await listUsers();
        if (active) {
          setUsers(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        if (active) {
          setPageError(error.response?.data?.message || 'Impossible de charger la liste des utilisateurs.');
        }
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isAdei]);

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

  if (!isAdei) {
    return <Navigate to="/annonces" replace />;
  }

  const handleToggleAccess = async (targetUser) => {
    setBusyUserId(targetUser.id);

    try {
      const updatedUser = await updateUserAccess(targetUser.id, { active: !targetUser.active });
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
      setPageError('');
    } catch (error) {
      setPageError(error.response?.data?.message || "Impossible de modifier l'acces de cet utilisateur.");
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => {
      const nomComplet = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return nomComplet.includes(query) || email.includes(query);
    });
  }, [users, searchQuery]);

  const totalActive = users.filter((item) => item.active).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-7">
            <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
              <div className="min-w-0">
                <h1 className="text-[20px] sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FiShield className="text-primary-500" size={20} aria-hidden />
                  <span>Gestion des acces</span>
                </h1>
                <p className="text-slate-500 mt-1 text-[11px] sm:text-[13px] leading-relaxed">
                  Consultez la liste des utilisateurs et activez ou desactivez leur acces.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-4 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white px-5 py-2.5 shadow-sm min-w-[180px]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 mb-0.5 leading-none">Comptes Actifs</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-slate-900 leading-none">{totalActive}</span>
                      <span className="text-xs font-medium text-slate-500">/ {users.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSearch((value) => !value)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-center ${
                    showSearch
                      ? 'border-primary-300 bg-primary-50 text-primary-700 ring-4 ring-primary-500/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600 shadow-sm'
                  }`}
                  aria-label={showSearch ? 'Fermer la recherche' : 'Rechercher'}
                  title={showSearch ? 'Fermer la recherche' : 'Rechercher'}
                >
                  {showSearch ? <FiX size={18} /> : <FiSearch size={18} />}
                </button>
              </div>
            </div>

            <div className="flex sm:hidden flex-col items-center gap-4">
              <div className="flex items-center gap-4 w-full rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white px-4 py-2.5 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 mb-0.5 leading-none">Comptes Actifs</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-slate-900 leading-none">{totalActive}</span>
                    <span className="text-xs font-medium text-slate-500">/ {users.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {showSearch && (
              <div className="mt-5 pt-5 border-t border-slate-200">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom ou email..."
                    className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 py-2.5 sm:py-3.5 pl-12 pr-10 text-[13px] sm:text-sm transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {pageError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <FiLoader className="animate-spin text-primary-400" size={32} />
                <p className="text-sm text-slate-500">Chargement des utilisateurs...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <h2 className="text-xl font-semibold text-slate-900">Aucun resultat trouve</h2>
              <p className="mt-2 text-sm text-slate-500">Essayez une autre recherche ou verifiez vos filtres.</p>
            </div>
          ) : (
            <>
              {/* Mobile List View (Hidden on sm and up) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filteredUsers.map((item) => {
                  const isBusy = busyUserId === item.id;
                  const isCurrentUser = item.id === user?.id;
                  return (
                    <div key={item.id} className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-slate-900 truncate">
                            {[item.firstName, item.lastName].filter(Boolean).join(' ') || 'Utilisateur'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{item.email}</p>
                          {isCurrentUser && <p className="text-[10px] font-semibold text-primary-600 mt-1 uppercase">Votre compte</p>}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {item.active ? 'Actif' : 'Desactive'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy || isCurrentUser}
                        onClick={() => handleToggleAccess(item)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] ${
                          item.active 
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isBusy ? <FiLoader className="animate-spin" size={15} /> : item.active ? <FiSlash size={15} /> : <FiUnlock size={15} />}
                        {item.active ? 'Desactiver l\'acces' : 'Activer l\'acces'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Utilisateur</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Statut</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((item) => {
                      const isBusy = busyUserId === item.id;
                      const isCurrentUser = item.id === user?.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900">
                              {[item.firstName, item.lastName].filter(Boolean).join(' ') || 'Utilisateur'}
                            </p>
                            {isCurrentUser && <p className="text-[11px] font-semibold text-primary-600 mt-0.5">Votre compte</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'}`}>
                            {item.active ? 'Actif' : 'Desactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={isBusy || isCurrentUser}
                            onClick={() => handleToggleAccess(item)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                              item.active 
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                          >
                            {isBusy ? (
                              <FiLoader className="animate-spin" size={16} />
                            ) : item.active ? (
                              <FiSlash size={16} />
                            ) : (
                              <FiUnlock size={16} />
                            )}
                            {item.active ? 'Desactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
