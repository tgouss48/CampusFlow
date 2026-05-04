import { createContext, useCallback, useContext, useState } from 'react';

const AnnoncesModalContext = createContext(null);

export function AnnoncesModalProvider({ children }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const openCreateModal = useCallback(() => setCreateOpen(true), []);
  const closeCreateModal = useCallback(() => setCreateOpen(false), []);
  const openEditModal = useCallback((annonce) => setEditTarget(annonce), []);
  const closeEditModal = useCallback(() => setEditTarget(null), []);

  return (
    <AnnoncesModalContext.Provider
      value={{
        createOpen,
        setCreateOpen,
        openCreateModal,
        closeCreateModal,
        editTarget,
        openEditModal,
        closeEditModal,
      }}
    >
      {children}
    </AnnoncesModalContext.Provider>
  );
}

export function useAnnoncesModal() {
  const ctx = useContext(AnnoncesModalContext);
  if (!ctx) {
    throw new Error('useAnnoncesModal must be used within AnnoncesModalProvider');
  }
  return ctx;
}
