import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
    try {
      setLoading(true);
      // 1. Check if system requires initial admin setup
      const setupRes = await api.get('/auth/setup/status');
      if (!setupRes.data.data.isInitialized) {
        setSetupRequired(true);
        setLoading(false);
        return;
      }

      setSetupRequired(false);

      // 2. Check if admin token is stored
      const token = localStorage.getItem('focsera_token');
      if (!token) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      // 3. Fetch admin profile & company settings
      const meRes = await api.get('/auth/me');
      if (meRes.data.success) {
        setAdmin(meRes.data.data.admin);
        setCompany(meRes.data.data.company);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('focsera_token', res.data.data.token);
      setAdmin(res.data.data.admin);
      setCompany(res.data.data.company);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const initializeSystem = async (payload) => {
    const res = await api.post('/auth/setup/initialize', payload);
    if (res.data.success) {
      localStorage.setItem('focsera_token', res.data.data.token);
      setAdmin(res.data.data.admin);
      setCompany(res.data.data.company);
      setSetupRequired(false);
      return res.data;
    }
    throw new Error(res.data.message || 'Setup failed');
  };

  const logout = () => {
    localStorage.removeItem('focsera_token');
    setAdmin(null);
    setCompany(null);
  };

  const updateCompany = (newCompany) => {
    setCompany(newCompany);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        company,
        loading,
        setupRequired,
        login,
        logout,
        initializeSystem,
        updateCompany,
        refreshAuth: checkAuthAndSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

