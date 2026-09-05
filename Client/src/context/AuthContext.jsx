import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// ============================================================================
// DEMO MOCK USERS & PERMISSIONS (Offline Development Fallback)
// ----------------------------------------------------------------------------
// If the backend API (port 5000) or PostgreSQL database is offline or not started,
// this dictionary provides fallback authentication so developers & testers can
// immediately access and test UI views like /payroll/rules without getting blocked.
// ============================================================================
const DEMO_USERS = {
  'admin@peoplepay360.com': {
    user: {
      id: 'usr-admin-001',
      email: 'admin@peoplepay360.com',
      role: 'ADMIN',
      employeeId: 'emp-001',
      employeeCode: 'ADM-001',
      firstName: 'Super',
      lastName: 'Admin',
      department: 'Executive Administration',
      jobPosition: 'System Administrator',
      displayName: 'Super Admin'
    },
    permissions: {
      canManageEmployees: true,
      canManageContracts: true,
      canManageSchedules: true,
      canApproveLeaves: true,
      canExecutePayruns: true,
      canFinalizePayruns: true,
      canManageSalaryRules: true,
      canManageBudgets: true,
      canResolveGrievances: true,
      canViewOwnSelfService: true,
      isSystemAdmin: true
    }
  },
  'payroll.manager@peoplepay360.com': {
    user: {
      id: 'usr-payroll-001',
      email: 'payroll.manager@peoplepay360.com',
      role: 'HR_PAYROLL_MANAGER',
      employeeId: 'emp-002',
      employeeCode: 'PAY-001',
      firstName: 'Payroll',
      lastName: 'Manager',
      department: 'Finance & Payroll',
      jobPosition: 'Payroll Director',
      displayName: 'Payroll Manager'
    },
    permissions: {
      canManageEmployees: true,
      canManageContracts: true,
      canManageSchedules: true,
      canApproveLeaves: true,
      canExecutePayruns: true,
      canFinalizePayruns: true,
      canManageSalaryRules: true,
      canManageBudgets: true,
      canResolveGrievances: true,
      canViewOwnSelfService: true,
      isSystemAdmin: false
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('peoplepay_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state on application startup or refresh
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('peoplepay_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Check if this is an offline demo token
      if (storedToken.startsWith('demo-token-')) {
        const demoEmail = storedToken.replace('demo-token-', '');
        if (DEMO_USERS[demoEmail]) {
          setUser(DEMO_USERS[demoEmail].user);
          setPermissions(DEMO_USERS[demoEmail].permissions);
          setLoading(false);
          return;
        }
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data.user);
          setPermissions(response.data.data.permissions);
        }
      } catch (error) {
        // If server is unreachable (offline), try using cached user if available
        const cachedUserStr = localStorage.getItem('peoplepay_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            setUser(cachedUser);
            setLoading(false);
            return;
          } catch {
            // parse error, continue cleanup
          }
        }

        console.error('Session validation error:', error.message);
        localStorage.removeItem('peoplepay_token');
        localStorage.removeItem('peoplepay_user');
        setToken(null);
        setUser(null);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function: supports expectedRole and provides offline development fallback
  const login = async (email, password, expectedRole = null) => {
    const cleanEmail = email.trim().toLowerCase();
    const payload = { email: cleanEmail, password };
    if (expectedRole) {
      payload.expectedRole = expectedRole;
    }

    try {
      // 1. First attempt: Real Backend API call
      const response = await api.post('/auth/login', payload);
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser, permissions: receivedPermissions } = response.data.data;
        localStorage.setItem('peoplepay_token', receivedToken);
        localStorage.setItem('peoplepay_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        setPermissions(receivedPermissions);
        return receivedUser;
      }
    } catch (apiErr) {
      // 2. Second attempt: Check if backend is down or unreachable
      const isNetworkOrDown = !apiErr.response || apiErr.code === 'ERR_NETWORK' || [502, 503, 504].includes(apiErr.response?.status);

      if (isNetworkOrDown && DEMO_USERS[cleanEmail] && password === 'Password@123') {
        console.info('[Auth] Backend API offline. Logging in via local development demo account:', cleanEmail);
        const demoData = DEMO_USERS[cleanEmail];
        const demoToken = `demo-token-${cleanEmail}`;
        localStorage.setItem('peoplepay_token', demoToken);
        localStorage.setItem('peoplepay_user', JSON.stringify(demoData.user));
        setToken(demoToken);
        setUser(demoData.user);
        setPermissions(demoData.permissions);
        return demoData.user;
      }

      // If backend responded with a real auth error (e.g. 401 Wrong Password), throw it
      throw new Error(apiErr.response?.data?.message || apiErr.message || 'Login failed');
    }
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
