'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '@/types';
import authUtils from '@/utils/auth';

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
    // In demo mode, we don't restore any persisted auth; start unauthenticated
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (email === 'admin@roadportal.com' && password === 'admin123') {
        const demoUser: AuthUser = {
          id: 'demo-admin',
          email: 'admin@roadportal.com',
          role: 'ADMIN',
          firstName: 'Demo',
          lastName: 'Admin',
        };
        // In demo mode we don't need a real token; just store user for convenience
        authUtils.setUser(demoUser);
        setUser(demoUser);
      } else {
        throw new Error('Invalid credentials for demo mode');
      }
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
