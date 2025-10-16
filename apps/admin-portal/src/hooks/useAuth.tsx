'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '@/types';
import authUtils from '@/utils/auth';
import apiClient from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authUtils.getToken();
        const savedUser = authUtils.getUser();
        
        if (token && savedUser) {
          setUser(savedUser);
          // Optionally verify token with server
          try {
            await apiClient.getDashboardStats();
          } catch (error) {
            // Token is invalid, clear auth
            authUtils.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authUtils.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login({ email, password });
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Verify user is admin
        if (userData.role !== 'ADMIN') {
          throw new Error('Access denied. Admin privileges required.');
        }
        
        authUtils.setToken(token);
        authUtils.setUser(userData);
        setUser(userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authUtils.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const savedUser = authUtils.getUser();
      if (savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
