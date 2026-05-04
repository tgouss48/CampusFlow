import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import SocialFloatWidget from './components/layout/SocialFloatWidget';
import AnnoncesPage from './pages/AnnoncesPage';
import EvenementsPage from './pages/EvenementsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ParametresPage from './pages/ParametresPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SocialePage from './pages/SocialePage';
import UserAccessManagementPage from './pages/UserAccessManagementPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { useAuth } from './context/AuthContext';

const AUTH_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];

const HIDE_FOOTER_ROUTES = AUTH_ROUTES;
const HIDE_NAVBAR_ROUTES = AUTH_ROUTES;

function App() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const showSidebar = isAuthenticated && !isAuthPage;
  const showFooter = !isAuthenticated && !HIDE_FOOTER_ROUTES.includes(location.pathname);
  const showNavbar = !isAuthenticated && !HIDE_NAVBAR_ROUTES.includes(location.pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return null;
  }

  const sidebarOffsetClass = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72';

  return (
    <div className={showSidebar ? 'min-h-screen bg-slate-50' : 'flex flex-col min-h-screen'}>
      {showSidebar && (
        <>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">CF</span>
              </div>
              <span className="font-bold text-slate-900 tracking-tight">CampusFlow</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}
        </>
      )}
      {showNavbar && <Navbar />}
      <main className={showSidebar ? `min-h-screen ${sidebarOffsetClass}` : 'flex-1'}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/annonces" replace /> : <HomePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/annonces" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/annonces" replace /> : <RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/annonces" replace /> : <ForgotPasswordPage />} />
          <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/annonces" replace /> : <ResetPasswordPage />} />
          <Route path="/annonces" element={isAuthenticated ? <AnnoncesPage /> : <Navigate to="/login" replace />} />
          <Route path="/annonces/new" element={isAuthenticated ? <Navigate to="/annonces" replace state={{ openCreate: true }} /> : <Navigate to="/login" replace />} />
          <Route path="/annonces/:id" element={isAuthenticated ? <Navigate to="/annonces" replace /> : <Navigate to="/login" replace />} />
          <Route path="/evenements" element={isAuthenticated ? <EvenementsPage /> : <Navigate to="/login" replace />} />
          <Route path="/sociale" element={isAuthenticated ? <SocialePage /> : <Navigate to="/login" replace />} />
          <Route path="/parametres" element={isAuthenticated ? <ParametresPage /> : <Navigate to="/login" replace />} />
          <Route path="/adei/utilisateurs" element={isAuthenticated ? <UserAccessManagementPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
      {showSidebar && <SocialFloatWidget onOpen={() => setMobileMenuOpen(false)} />}
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
