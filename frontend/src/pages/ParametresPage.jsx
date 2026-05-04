import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FiLoader, FiLock, FiSave, FiUser, FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { changePassword, updateProfile } from '../services/authService';

export default function ParametresPage() {
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, user, updateCurrentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || user?.prenom || '',
    lastName: user?.lastName || user?.nom || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileState, setProfileState] = useState({ loading: false, error: '', success: '' });
  const [passwordState, setPasswordState] = useState({ loading: false, error: '', success: '' });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();

    if (!firstName || !lastName) {
      setProfileState({ loading: false, error: 'Le nom et le prenom sont obligatoires.', success: '' });
      return;
    }

    setProfileState({ loading: true, error: '', success: '' });

    try {
      const updatedUser = await updateProfile({ firstName, lastName });
      updateCurrentUser(updatedUser);
      setProfileForm({ firstName: updatedUser.firstName || '', lastName: updatedUser.lastName || '' });
      setProfileState({ loading: false, error: '', success: 'Profil mis a jour avec succes.' });
    } catch (error) {
      setProfileState({
        loading: false,
        error: error.response?.data?.message || 'Impossible de mettre a jour le profil.',
        success: '',
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordState({ loading: false, error: 'Veuillez remplir tous les champs.', success: '' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordState({
        loading: false,
        error: 'Le nouveau mot de passe doit contenir au moins 8 caracteres.',
        success: '',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState({
        loading: false,
        error: 'La confirmation du mot de passe ne correspond pas.',
        success: '',
      });
      return;
    }

    setPasswordState({ loading: true, error: '', success: '' });

    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordState({
        loading: false,
        error: '',
        success: response?.message || 'Mot de passe mis a jour avec succes.',
      });
    } catch (error) {
      setPasswordState({
        loading: false,
        error: error.response?.data?.message || 'Impossible de changer le mot de passe.',
        success: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative py-8 lg:py-10 pb-24">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* En-tete: Titre dans une carte style Annonces/Evenements */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-fade-in-up">
          <div className="px-5 sm:px-6 py-5 sm:py-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FiSettings className="text-primary-500" size={20} aria-hidden />
              <span>Parametres</span>
            </h1>
            <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">
              Modifiez votre profil et securisez votre compte.
            </p>
          </div>
        </div>

        {/* Le grand conteneur (Unique Card) qui englobe les Tabs et le Formulaire */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in-up animate-delay-100">
          
          {/* Navigation par Onglets (Tabs) */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3.5 sm:py-4 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-600 text-primary-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <FiUser size={16} className={activeTab === 'profile' ? 'text-primary-600' : 'text-slate-400'} />
              <span className="hidden sm:inline text-xs sm:text-sm">Informations personnelles</span>
              <span className="sm:hidden text-xs">Profil</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-3.5 sm:py-4 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 border-b-2 ${
                activeTab === 'security'
                  ? 'border-orange-500 text-orange-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <FiLock size={16} className={activeTab === 'security' ? 'text-orange-500' : 'text-slate-400'} />
              <span className="hidden sm:inline text-xs sm:text-sm">Mot de passe et Securite</span>
              <span className="sm:hidden text-xs">Securite</span>
            </button>
          </div>

          {/* Espace Contenu Formulaire */}
          <div className="p-6 sm:p-8">
            
            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 text-white shadow-md shadow-primary-500/20">
                    <FiUser size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Vos informations</h2>
                    <p className="text-xs font-medium text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleProfileSubmit}>
                  {profileState.error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                      {profileState.error}
                    </div>
                  )}
                  {profileState.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                      {profileState.success}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="settings-first-name" className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                        Prenom
                      </label>
                      <input
                        id="settings-first-name"
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-400"
                        value={profileForm.firstName}
                        onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="settings-last-name" className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                        Nom
                      </label>
                      <input
                        id="settings-last-name"
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-400"
                        value={profileForm.lastName}
                        onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full sm:w-auto relative inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                      disabled={profileState.loading}
                    >
                      {profileState.loading ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20">
                    <FiLock size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Securite du compte</h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Mettez a jour votre cle d'acces.</p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  {passwordState.error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                      {passwordState.error}
                    </div>
                  )}
                  {passwordState.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                      {passwordState.success}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="settings-current-password" className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <input
                        id="settings-current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 tracking-widest font-mono text-sm transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-400/10 placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400"
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                      >
                        {showCurrentPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="settings-new-password" className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="settings-new-password"
                        type={showNewPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 tracking-widest font-mono text-sm transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-400/10 placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="settings-confirm-password" className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="settings-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 tracking-widest font-mono text-sm transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-400/10 placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full sm:w-auto relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                      disabled={passwordState.loading}
                    >
                      {passwordState.loading ? <FiLoader className="animate-spin" size={16} /> : <FiLock size={16} />}
                      Changer de mot de passe
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
