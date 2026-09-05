import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('peoplepay_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('peoplepay_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data.user);
          setPermissions(response.data.data.permissions);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem('peoplepay_token');
        setToken(null);
        setUser(null);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token: receivedToken, user: receivedUser, permissions: receivedPermissions } = response.data.data;
      localStorage.setItem('peoplepay_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setPermissions(receivedPermissions);
      return receivedUser;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Logout API notification failed, proceeding with client cleanup:', err);
    } finally {
      localStorage.removeItem('peoplepay_token');
      setToken(null);
      setUser(null);
      setPermissions(null);
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  const value = {
    user,
    role: user?.role,
    permissions,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
