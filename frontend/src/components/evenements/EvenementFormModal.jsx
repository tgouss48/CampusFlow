import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiMapPin,
  FiSend,
  FiType,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import evenementService from '../../services/evenementService';

const emptyForm = {
  titre: '',
  description: '',
  lieu: '',
  dateDebut: '',
  dateFin: '',
  capaciteMax: 10,
};

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const WEEK_DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function splitDateTimeValue(value) {
  if (!value) {
    return { date: '', time: '' };
  }

  const [date = '', time = ''] = String(value).split('T');
  return {
    date,
    time: time.slice(0, 5),
  };
}

function normalizeTimeInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function formatDisplayDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Choisir date';
  }

  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function evenementToForm(evenement) {
  if (!evenement) {
    return { ...emptyForm };
  }

  return {
    titre: evenement.titre || '',
    description: evenement.description || '',
    lieu: evenement.lieu || '',
    dateDebut: toDateTimeLocal(evenement.dateDebut),
    dateFin: toDateTimeLocal(evenement.dateFin),
    capaciteMax: Number(evenement.capaciteMax || 10),
  };
}

function getInitialCalendarDate(value, minDate) {
  const source = value || minDate;
  if (source) {
    const [year, month] = source.split('-').map(Number);
    if (year && month) {
      return new Date(year, month - 1, 1);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - startWeekDay + 1;
    const cellDate = new Date(year, month, dayOffset);
    cells.push({
      key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
      date: cellDate,
      value: `${cellDate.getFullYear()}-${pad(cellDate.getMonth() + 1)}-${pad(cellDate.getDate())}`,
      label: cellDate.getDate(),
      isCurrentMonth: dayOffset >= 1 && dayOffset <= daysInMonth,
    });
  }

  while (cells.length > 35 && cells.slice(-7).every((cell) => !cell.isCurrentMonth)) {
    cells.splice(-7, 7);
  }

  return cells;
}

function DatePickerField({ id, label, value, onChange, minDate }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => getInitialCalendarDate(value, minDate));
  const wrapperRef = useRef(null);
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setViewDate(getInitialCalendarDate(value, minDate));
  }, [value, minDate]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  const selectDate = (dateValue) => {
    if (minDate && dateValue < minDate) return;
    onChange(dateValue);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (
        <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
          <FiCalendar size={14} className="text-primary-400" />
          {label}
        </label>
      ) : null}

      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`input-field flex items-center justify-between text-left ${open ? 'border-primary-400 bg-white ring-2 ring-primary-500/20' : ''}`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {formatDisplayDate(value)}
        </span>
        <FiCalendar size={18} className="text-slate-500" />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+0.45rem)] left-0 z-20 w-[272px] rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.14)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-bold text-slate-900">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="py-1 uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSelected = value === day.value;
              const isDisabled = Boolean(minDate && day.value < minDate);

              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(day.value)}
                  className={`flex h-8 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm'
                      : day.isCurrentMonth
                        ? 'text-slate-800 hover:bg-primary-50 hover:text-primary-700'
                        : 'text-slate-300 hover:bg-slate-50'
                  } ${isDisabled ? 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-slate-300' : ''}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              Effacer
            </button>

            <button
              type="button"
              onClick={() => {
                setViewDate(getInitialCalendarDate(today));
                selectDate(today);
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvenementFormModal({
  open,
  mode = 'create',
  initialEvenement = null,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setFormData(evenementToForm(initialEvenement));
  }, [open, initialEvenement]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDatePartChange = (field, part, value) => {
    setFormData((prev) => {
      const current = splitDateTimeValue(prev[field]);
      const next = { ...current, [part]: part === 'time' ? normalizeTimeInput(value) : value };
      return {
        ...prev,
        [field]: next.date || next.time ? `${next.date}${next.time ? `T${next.time}` : ''}` : '',
      };
    });
    setError('');
  };

  if (!open) return null;

  const startParts = splitDateTimeValue(formData.dateDebut);
  const endParts = splitDateTimeValue(formData.dateFin);

  const validate = () => {
    if (!formData.titre.trim()) return 'Le titre est obligatoire.';
    if (!formData.description.trim()) return 'La description est obligatoire.';
    if (!formData.lieu.trim()) return 'Le lieu est obligatoire.';
    if (!startParts.date) return 'La date de debut est obligatoire.';
    if (!endParts.date) return 'La date de fin est obligatoire.';
    if (!/^\d{2}:\d{2}$/.test(startParts.time)) return "L'heure de debut est invalide.";
    if (!/^\d{2}:\d{2}$/.test(endParts.time)) return "L'heure de fin est invalide.";
    if (!Number(formData.capaciteMax) || Number(formData.capaciteMax) < 1) {
      return 'La capacite max doit etre superieure ou egale a 1.';
    }
    if (new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
      return 'La date de fin doit etre apres la date de debut.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      lieu: formData.lieu.trim(),
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin,
      capaciteMax: Number(formData.capaciteMax),
    };

    setLoading(true);
    try {
      const response =
        mode === 'edit' && initialEvenement?.id
          ? await evenementService.updateEvenement(initialEvenement.id, payload)
          : await evenementService.createEvenement(payload);

      onSuccess?.(response.data);
      onClose?.();
    } catch (err) {
      console.error('EvenementFormModal submit', err);
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
      aria-labelledby="evenement-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative w-full rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-center border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur rounded-t-3xl sm:rounded-t-3xl">
          <div className="text-center">
            <h2 id="evenement-form-title" className="text-lg font-bold text-slate-900 sm:text-xl">
              {mode === 'edit' ? "Modifier l'evenement" : 'Nouvel evenement'}
            </h2>
            <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Renseignez les informations principales de votre evenement
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] sm:max-h-[80vh] overflow-y-auto px-5 py-5 pb-10 sm:px-6 sm:py-6">
          <div className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="event-title" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FiType size={14} className="text-primary-400" />
                Titre
              </label>
              <input
                id="event-title"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                maxLength={150}
                placeholder="Comment s'appelle votre événement ?"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="evenement-description" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FiFileText size={14} className="text-primary-400" />
                Description
              </label>
              <textarea
                id="evenement-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                maxLength={2000}
                placeholder="Décrivez le programme, les objectifs et toute information utile pour les participants..."
                className="input-field resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="event-location" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FiMapPin size={14} className="text-primary-400" />
                  Lieu
                </label>
                <input
                  id="event-location"
                  name="lieu"
                  value={formData.lieu}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="Ex: Amphitheatre B"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="event-capacity" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FiUsers size={14} className="text-primary-400" />
                  Capacite max
                </label>
                <input
                  id="event-capacity"
                  name="capaciteMax"
                  type="number"
                  min="1"
                  value={formData.capaciteMax}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="event-start-date" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FiCalendar size={14} className="text-primary-400" />
                  Date de debut
                </label>
                <div className="grid grid-cols-[1.55fr_0.95fr] gap-3 items-end">
                  <DatePickerField
                    id="event-start-date"
                    label=""
                    value={startParts.date}
                    onChange={(value) => handleDatePartChange('dateDebut', 'date', value)}
                  />
                  <div>
                    <input
                      id="event-start-time"
                      type="text"
                      inputMode="numeric"
                      value={startParts.time}
                      placeholder="HH:mm"
                      maxLength={5}
                      onChange={(event) => handleDatePartChange('dateDebut', 'time', event.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="event-end-date" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FiCalendar size={14} className="text-primary-400" />
                  Date de fin
                </label>
                <div className="grid grid-cols-[1.55fr_0.95fr] gap-3 items-end">
                  <DatePickerField
                    id="event-end-date"
                    label=""
                    value={endParts.date}
                    minDate={startParts.date}
                    onChange={(value) => handleDatePartChange('dateFin', 'date', value)}
                  />
                  <div>
                    <input
                      id="event-end-time"
                      type="text"
                      inputMode="numeric"
                      value={endParts.time}
                      placeholder="HH:mm"
                      maxLength={5}
                      onChange={(event) => handleDatePartChange('dateFin', 'time', event.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-initial">
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex flex-1 items-center justify-center gap-2 sm:flex-initial"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              ) : (
                <>
                  <FiSend size={16} />
                  {mode === 'edit' ? 'Enregistrer' : 'Publier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
