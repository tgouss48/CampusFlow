import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { FiLogOut, FiSettings, FiShield, FiX, FiBell } from 'react-icons/fi';
import { HiOutlineMenuAlt3, HiOutlineSpeakerphone } from 'react-icons/hi';
import { MdOutlineEvent } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import NotificationsPanel from './NotificationsPanel';

export default function Sidebar({ collapsed = false, onToggleCollapsed, mobileOpen = false, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const fullName = [user?.prenom || user?.firstName, user?.nom || user?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const displayName = fullName || user?.fullName || user?.email || 'Utilisateur';
  const avatarLetter = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const isAdei = user?.role === 'ADEI' || user?.roles?.includes('ADEI');
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: '/annonces', label: 'Annonces', icon: HiOutlineSpeakerphone },
    { to: '/evenements', label: 'Evenements', icon: MdOutlineEvent },
    ...(isAdei ? [{ to: '/adei/utilisateurs', label: 'Acces utilisateurs', icon: FiShield }] : []),
  ];

  const handleNavClick = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    handleNavClick();
    logout();
  };

  return (
    <aside
      className={`fixed lg:fixed left-0 top-0 h-screen z-30 flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/80 transition-all duration-300 flex-none 
        ${mobileOpen ? 'translate-x-0 shadow-2xl !z-[100]' : '-translate-x-full lg:translate-x-0'} 
        ${collapsed ? 'w-20' : 'w-72'}`}
      style={{ boxShadow: mobileOpen ? '10px 0 50px rgba(0, 0, 0, 0.1)' : '4px 0 24px rgba(0, 0, 0, 0.02)' }}
    >
      <div className="flex-none border-b border-slate-100/80 bg-transparent">
        {collapsed ? (
          <div className="px-2 py-4 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-all flex items-center justify-center"
              aria-label="Ouvrir le menu"
              title="Ouvrir le menu"
            >
              <HiOutlineMenuAlt3 size={22} aria-hidden />
            </button>

            <Link
              to="/annonces"
              onClick={handleNavClick}
              className="group"
              aria-label="CampusFlow"
              title="CampusFlow"
            >
              <Logo size="lg" className="hover:scale-105 transition-transform duration-300" />
            </Link>
          </div>
        ) : (
          <div className="px-5 py-5 flex items-center justify-between gap-3">
            <Link to="/annonces" onClick={handleNavClick} className="flex items-center gap-2 group w-fit">
              <Logo size="md" className="group-hover:scale-105 transition-transform duration-300" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">CampusFlow</span>
                <span className="text-xs font-semibold text-slate-500">Espace connecte</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={mobileOpen ? onCloseMobile : onToggleCollapsed}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-all"
              aria-label={mobileOpen ? "Fermer le menu" : "Reduire le menu"}
              title={mobileOpen ? "Fermer le menu" : "Reduire le menu"}
            >
              <FiX size={18} aria-hidden />
            </button>
          </div>
        )}
      </div>

      <div className="px-3 py-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar bg-transparent">

        {/* Navigation principale */}
        <div className="space-y-1.5">
          {!collapsed && <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`group relative flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive(item.to)
                      ? 'font-semibold text-primary-700 bg-primary-50/80 ring-1 ring-inset ring-primary-100/50 shadow-[inset_0px_1px_3px_rgba(0,0,0,0.02)]'
                      : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} aria-hidden className={isActive(item.to) ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && Number(item.badge || 0) > 0 && (
                    <span className="ml-auto rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Compte Utilisateur (Rassemblement strict) */}
        <div className="space-y-1.5">
          {!collapsed && <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mon Espace</p>}
          <div
            className={`flex items-center ${collapsed ? 'justify-center px-1' : 'gap-3 px-3'} py-3 mb-3 rounded-xl bg-white/60 border border-slate-200/60 shadow-sm`}
            title={collapsed ? user?.email || '' : undefined}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 text-sm font-bold shrink-0 border border-slate-300/50">
              {avatarLetter}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>

          <div className="space-y-1 relative">
            <NotificationsPanel collapsed={collapsed} onAction={handleNavClick} />

            <button
              type="button"
              className={`group w-full flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors`}
              onClick={() => {
                handleNavClick();
                navigate('/parametres');
              }}
              title={collapsed ? 'Parametres' : undefined}
            >
              <FiSettings size={18} aria-hidden className="text-slate-400 group-hover:text-slate-600" />
              {!collapsed && <span>Parametres</span>}
            </button>

            <button
              type="button"
              className={`group w-full flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 transition-colors`}
              onClick={handleLogout}
              title={collapsed ? 'Deconnexion' : undefined}
            >
              <FiLogOut size={18} aria-hidden className="text-rose-400 group-hover:text-rose-600" />
              {!collapsed && <span>Deconnexion</span>}
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
