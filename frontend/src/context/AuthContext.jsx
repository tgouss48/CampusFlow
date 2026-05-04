import { createContext, useContext, useEffect, useState } from 'react';
import { bootstrapAccessToken, clearAccessToken, setAccessToken } from '../services/api';
import { loginUser, logoutUser, prepareAuthForms, registerUser } from '../services/authService';
import { sendPresenceOffline } from '../services/socialService';

const AuthContext = createContext(null);

function normalizeUser(userData) {
  if (!userData) {
    return null;
  }

  const roles = Array.isArray(userData.roles)
    ? userData.roles
    : typeof userData.role === 'string' && userData.role.trim()
      ? [userData.role]
      : [];

  return {
    ...userData,
    prenom: userData.firstName,
    nom: userData.lastName,
    roles,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('campusflow_token');
    localStorage.removeItem('campusflow_user');

    let active = true;

    const hydrateSession = async () => {
      try {
        const session = await bootstrapAccessToken();
        if (!active) {
          return;
        }
        setToken(session?.accessToken || null);
        setUser(normalizeUser(session?.user));
      } catch {
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      await prepareAuthForms();
      const response = await loginUser({ email, password });
      setAccessToken(response.accessToken);
      setToken(response.accessToken);
      setUser(normalizeUser(response.user));
      return { success: true };
    } catch (error) {
      clearAccessToken();
      setToken(null);
      setUser(null);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion. Verifiez vos identifiants.',
      };
    }
  };

  const register = async (userData) => {
    try {
      await prepareAuthForms();
      const data = await registerUser(userData);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erreur lors de l'inscription.",
      };
    }
  };

  const logout = async () => {
    try {
      await sendPresenceOffline();
    } catch (error) {
      // Best effort: local logout should still continue even if presence update fails.
    }

    try {
      await logoutUser();
    } catch (error) {
      // Best effort: local cleanup still signs the user out on the frontend.
    }

    clearAccessToken();
    setToken(null);
    setUser(null);
  };

  const updateCurrentUser = (userData) => {
    setUser(normalizeUser(userData));
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, login, register, logout, updateCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
