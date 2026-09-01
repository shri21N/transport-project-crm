import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('transport_crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('transport_crm_token') || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check and refresh user session on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('transport_crm_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('transport_crm_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('transport_crm_token', res.token);
        localStorage.setItem('transport_crm_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Invalid email or password',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('transport_crm_token');
    localStorage.removeItem('transport_crm_user');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('transport_crm_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUserProfile,
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

export default AuthContext;
