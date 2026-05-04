import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff, FiXCircle, FiLock } from 'react-icons/fi';
import { resetPassword, validateResetToken } from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenInvalidError, setTokenInvalidError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenInvalidError('Le lien de reinitialisation est absent ou invalide.');
      setIsValidating(false);
      return;
    }
    
    validateResetToken(token)
      .then(() => {
        setTokenInvalidError('');
      })
      .catch((err) => {
        setTokenInvalidError(err.response?.data?.message || 'Ce lien a expire ou a deja ete utilise.');
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [token]);

  const validationError = useMemo(() => {
    if (tokenInvalidError) return '';
    if (!formData.password || !formData.confirmPassword) return '';
    if (formData.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres.';
    if (formData.password !== formData.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    return '';
  }, [formData, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({ token, newPassword: formData.password });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Impossible de reinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 md:py-24 relative flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="relative z-10 w-full max-w-[330px] sm:max-w-xl mx-auto">
        <div className="glass-strong rounded-[32px] p-5 sm:p-10 shadow-xl border border-white/50">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-5">
            <FiArrowLeft size={14} />
            Retour a la connexion
          </Link>

          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 leading-tight">Reinitialiser le mot de passe</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Choisis un nouveau mot de passe solide pour securiser ton compte.
          </p>

          {isValidating ? (
            <div className="mt-8 text-center py-6 text-slate-500">
              Vérification du lien sécurisé...
            </div>
          ) : tokenInvalidError ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
              <div className="flex items-center gap-3">
                <FiXCircle size={20} className="shrink-0" />
                <span>{tokenInvalidError}</span>
              </div>
              <Link to="/forgot-password" className="inline-flex mt-4 text-sm font-medium text-red-900 hover:text-red-700 underline">
                Demander un nouveau lien
              </Link>
            </div>
          ) : message ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
              <div className="flex items-center gap-3">
                <FiCheckCircle size={20} />
                <span>{message}</span>
              </div>
              <Link to="/login" className="inline-flex mt-4 text-sm font-medium text-emerald-900 hover:text-emerald-700 underline">
                Se connecter maintenant
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  className="input-field !pl-11 !pr-11"
                  placeholder="Nouveau mot de passe"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="input-field !pl-11"
                  placeholder="Confirmer le mot de passe"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
