import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiMail, FiLoader } from 'react-icons/fi';
import { confirmEmailVerification, validateEmailVerificationToken, requestEmailVerification } from '../services/authService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'used', 'expired', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Le lien de verification est absent ou invalide.');
      return;
    }

    validateEmailVerificationToken(token)
      .then(() => {
        // Token is valid, we can auto-confirm it
        return confirmEmailVerification({ token });
      })
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        const msg = err.response?.data?.message || '';
        if (msg.includes('deja ete utilise')) {
          setStatus('used');
        } else if (msg.includes('expire')) {
          setStatus('expired');
        } else {
          setStatus('error');
          setErrorMessage(msg || 'Impossible de verifier le lien.');
        }
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    
    setResendStatus('loading');
    try {
      await requestEmailVerification({ email: resendEmail });
      setResendStatus('success');
    } catch (err) {
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 md:py-24 relative flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="relative z-10 w-full max-w-[350px] sm:max-w-md mx-auto">
        <div className="glass-strong rounded-[32px] p-5 sm:p-10 text-center shadow-xl border border-white/50">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <FiLoader className="animate-spin text-primary-500 mb-4" size={40} />
              <h1 className="text-2xl font-bold text-slate-900">Verification en cours</h1>
              <p className="text-slate-600 mt-2">Veuillez patienter pendant que nous validons votre email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                <FiCheckCircle className="text-emerald-500" size={28} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Email verifie !</h1>
              <p className="text-sm text-slate-600 mt-2">Votre adresse email a ete confirmee avec succes.</p>
              <Link to="/login" className="btn-primary mt-8 w-full">
                Se connecter
              </Link>
            </div>
          )}

          {status === 'used' && (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-5">
                <FiCheckCircle className="text-blue-500" size={28} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Email deja verifie</h1>
              <p className="text-sm text-slate-600 mt-2">Ce lien a deja ete utilise. Votre compte est deja actif !</p>
              <Link to="/login" className="btn-primary mt-8 w-full">
                Se connecter
              </Link>
            </div>
          )}

          {(status === 'expired' || status === 'error') && (
            <div className="flex flex-col items-center text-left w-full">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6 mx-auto">
                <FiXCircle className="text-red-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center w-full">Lien invalide ou expire</h1>
              <p className="text-slate-600 mt-2 text-center w-full">
                {status === 'expired' 
                  ? "Ce lien de verification a expire (valable 24h)." 
                  : errorMessage}
              </p>

              <div className="mt-8 w-full bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FiMail className="text-primary-500" />
                  Recevoir un nouveau lien
                </h3>
                
                {resendStatus === 'success' ? (
                  <p className="text-sm text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    Un nouveau lien de verification vous a ete envoye par email.
                  </p>
                ) : (
                  <form onSubmit={handleResend} className="mt-3">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="input-field mb-3"
                      required
                    />
                    {resendStatus === 'error' && (
                      <p className="text-xs text-red-500 mb-3">Erreur lors de l'envoi. Verifiez votre email.</p>
                    )}
                    <button 
                      type="submit" 
                      disabled={resendStatus === 'loading' || !resendEmail} 
                      className="btn-primary w-full py-2.5 text-sm"
                    >
                      {resendStatus === 'loading' ? 'Envoi...' : 'Renvoyer le lien'}
                    </button>
                  </form>
                )}
              </div>
              <Link to="/login" className="mt-6 text-sm text-slate-500 hover:text-slate-800 font-medium text-center w-full">
                Retour a la connexion
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
