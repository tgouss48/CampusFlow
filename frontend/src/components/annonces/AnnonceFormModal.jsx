import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCheck,
  FiChevronDown,
  FiFileText,
  FiLayers,
  FiSend,
  FiTag,
  FiType,
  FiX,
  FiPackage,
  FiSearch,
  FiTool,
  FiPlusCircle
} from 'react-icons/fi';
import annonceService from '../../services/annonceService';

const TYPES = [
  { value: 'OFFRE', label: 'Offre', desc: 'Vous proposez', icon: FiPackage, color: 'text-blue-500' },
  { value: 'DEMANDE', label: 'Demande', desc: 'Vous cherchez', icon: FiSearch, color: 'text-amber-500' },
  { value: 'SERVICE', label: 'Service', desc: 'Aide/Entraide', icon: FiTool, color: 'text-emerald-500' },
  { value: 'AUTRE', label: 'Autre', desc: 'Divers', icon: FiPlusCircle, color: 'text-slate-500' },
];

const CATEGORIES = [
  { value: 'LIVRES_FOURNITURES', label: 'Livres & Fournitures', hint: 'Manuels, cahiers, calculatrices' },
  { value: 'INFORMATIQUE', label: 'Informatique', hint: 'PC, accessoires, logiciels' },
  { value: 'LOGEMENT', label: 'Logement', hint: 'Chambres, colocations, locations' },
  { value: 'TRANSPORT', label: 'Transport', hint: 'Covoiturage, scooters, trajets' },
  { value: 'COURS_SOUTIEN', label: 'Cours & Soutien', hint: 'Tutorat, coaching, accompagnement' },
  { value: 'DIVERS', label: 'Divers', hint: 'Autres annonces utiles du campus' },
];

const emptyForm = {
  titre: '',
  description: '',
  type: 'OFFRE',
  categorie: 'LIVRES_FOURNITURES',
};

function annonceToForm(annonce) {
  if (!annonce) return { ...emptyForm };
  return {
    titre: annonce.titre || '',
    description: annonce.description || '',
    type: annonce.type || 'OFFRE',
    categorie: annonce.categorie?.code ?? 'LIVRES_FOURNITURES',
  };
}

export default function AnnonceFormModal({ open, onClose, mode, initialAnnonce, onSuccess }) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  const selectedCategory = useMemo(
    () => CATEGORIES.find((category) => category.value === formData.categorie) ?? CATEGORIES[0],
    [formData.categorie]
  );

  useEffect(() => {
    if (!open) return;
    setError('');
    setCategoryOpen(false);
    if (mode === 'edit' && initialAnnonce) {
      setFormData(annonceToForm(initialAnnonce));
    } else {
      setFormData({ ...emptyForm });
    }
  }, [open, mode, initialAnnonce]);

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

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCategorySelect = (categoryValue) => {
    setFormData({ ...formData, categorie: categoryValue });
    setCategoryOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titre.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (formData.titre.length > 150) {
      setError('Le titre ne doit pas depasser 150 caracteres.');
      return;
    }
    if (!formData.description.trim()) {
      setError('La description est obligatoire.');
      return;
    }
    if (formData.description.length > 2000) {
      setError('La description ne doit pas depasser 2000 caracteres.');
      return;
    }

    const payload = {
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      type: formData.type,
      categorie: formData.categorie,
    };

    setLoading(true);
    try {
      const res =
        mode === 'edit' && initialAnnonce?.id
          ? await annonceService.updateAnnonce(initialAnnonce.id, payload)
          : await annonceService.createAnnonce(payload);
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error('AnnonceFormModal submit:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue. Reessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="annonce-form-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] sm:max-h-[95vh] w-full overflow-visible rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-center border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur rounded-t-3xl sm:rounded-t-3xl">
          <div className="text-center">
            <h2 id="annonce-form-modal-title" className="text-lg font-bold text-slate-900 sm:text-xl">
              {mode === 'edit' ? "Modifier l'annonce" : 'Nouvelle annonce'}
            </h2>
            <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Renseignez les détails de votre annonce
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(95vh-84px)] space-y-6 overflow-y-auto p-5 pb-10 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiLayers size={14} className="text-primary-400" />
              Type d&apos;annonce
            </label>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50/50 text-primary-900 ring-2 ring-primary-500/20'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className={`mb-2 rounded-xl p-2 ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100/50'}`}>
                      <Icon className={isSelected ? type.color : 'text-slate-400'} size={20} />
                    </div>
                    <div className="text-sm font-bold">{type.label}</div>
                    <div className="mt-1 text-[10px] leading-tight opacity-70">{type.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="modal-annonce-title" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiType size={14} className="text-primary-400" />
              Titre
            </label>
            <input
              id="modal-annonce-title"
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Quel est l'objet de votre annonce ?"
              maxLength={150}
              className="input-field"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400 font-medium">{formData.titre.length}/150</p>
          </div>

          <div>
            <label htmlFor="modal-annonce-description" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiFileText size={14} className="text-primary-400" />
              Description
            </label>
            <textarea
              id="modal-annonce-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez les points clés : état, prix, disponibilité..."
              rows={5}
              maxLength={2000}
              className="input-field resize-none leading-relaxed"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400 font-medium">{formData.description.length}/2000</p>
          </div>

          <div>
            <label htmlFor="modal-annonce-categorie" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiTag size={14} className="text-primary-400" />
              Catégorie
            </label>
            <div ref={categoryRef} className="relative">
              <button
                id="modal-annonce-categorie"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((prev) => !prev)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                  categoryOpen
                    ? 'border-primary-400 bg-white ring-4 ring-primary-500/10 shadow-lg'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="block truncate text-sm font-bold text-slate-900">{selectedCategory.label}</span>
                  <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${categoryOpen ? 'rotate-180' : ''}`} size={18} />
                </span>
              </button>

              {categoryOpen && (
                <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <ul role="listbox" aria-labelledby="modal-annonce-categorie" className="max-h-56 overflow-y-auto py-2">
                    {CATEGORIES.map((category) => {
                      const isSelected = formData.categorie === category.value;
                      return (
                        <li key={category.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleCategorySelect(category.value)}
                            className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors duration-200 ${
                              isSelected ? 'bg-primary-50 text-primary-900' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-bold">{category.label}</div>
                              <div className="text-[10px] opacity-60">{category.hint}</div>
                            </div>
                            {isSelected && <FiCheck className="shrink-0 text-primary-600" size={16} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto !px-8"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto !px-10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <FiSend size={18} />
                  <span>{mode === 'edit' ? 'Enregistrer' : 'Publier'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
