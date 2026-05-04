import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineMenuAlt3, HiX } from 'react-icons/hi';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useAnnoncesModal } from '../../context/AnnoncesModalContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { openCreateModal } = useAnnoncesModal();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const goCreateAnnonce = () => {
    if (location.pathname === '/annonces') {
      openCreateModal();
    } else {
      navigate('/annonces', { state: { openCreate: true } });
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  const navLinks = [];

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200 shadow-sm' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" id="navbar-logo" className="flex items-center gap-1.5 group">
            <Logo size="md" className="group-hover:scale-105 transition-transform duration-300" />
            <span className="text-xl font-bold gradient-text-hero">CampusFlow</span>
          </Link>

          <div className="hidden md:flex items-center gap-1" />

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  id="nav-create-annonce"
                  onClick={goCreateAnnonce}
                  className="btn-primary text-sm !px-4 !py-2"
                >
                  + Nouvelle annonce
                </button>
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                    {user?.prenom?.[0] || user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={logout}
                    id="nav-logout-btn"
                    className="btn-ghost text-sm text-slate-600 hover:text-red-600"
                  >
                    Deconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" id="nav-login-btn" className="btn-ghost text-sm">
                  Se connecter
                </Link>
                <Link to="/register" id="nav-register-btn" className="btn-primary text-sm !px-5 !py-2">
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((current) => !current)}
            id="mobile-menu-toggle"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {mobileOpen ? <HiX size={24} /> : <HiOutlineMenuAlt3 size={24} />}
          </button>
        </div>
      </div>

      <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/98 backdrop-blur-2xl border-t border-slate-200 px-4 py-4 space-y-2 shadow-sm">
          <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={goCreateAnnonce}
                  className="block w-full btn-primary text-sm text-center"
                >
                  + Nouvelle annonce
                </button>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all"
                >
                  Deconnexion
                </button>
              </>
            ) : (
              <div className="space-y-3 pt-2">
                <Link
                  to="/login"
                  className="block w-full py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 text-center transition-all"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="block w-full btn-primary text-sm font-semibold py-3.5 text-center"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
