import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiSend } from 'react-icons/fi';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const data = await forgotPassword({ email });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d'envoyer l'email pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-24 relative flex items-center justify-center">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="relative z-10 w-full max-w-xl">
        <div className="glass-strong rounded-3xl p-8 md:p-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
            <FiArrowLeft size={15} />
            Retour a la connexion
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Mot de passe oublie</h1>
          <p className="text-slate-600 mt-3">
            Saisis ton email. Si le compte existe, on enverra un lien de reinitialisation.
          </p>

          <div className="mt-8 space-y-4">
            {!message && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input-field !pl-11"
                    placeholder="Email"
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  <FiSend size={16} />
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
