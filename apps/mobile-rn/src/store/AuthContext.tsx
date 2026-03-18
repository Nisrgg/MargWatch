import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fcmApi } from '../api/fcmApi';
import type { User } from '@margwatch/shared-types';

const DEMO_FLAG_KEY = '@margwatch_demo_logged_in';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  registerFcmToken: (fcmToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const persistDemoAuth = useCallback(async (newUser: User) => {
    await AsyncStorage.setItem(DEMO_FLAG_KEY, 'true');
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(async () => {
    await AsyncStorage.removeItem(DEMO_FLAG_KEY);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const demoFlag = await AsyncStorage.getItem(DEMO_FLAG_KEY);
      if (demoFlag === 'true') {
        const demoUser: User = {
          id: 'demo-user',
          email: 'user@roadportal.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'USER' as any,
          isActive: true,
          phone: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fcmToken: null,
        };
        setUser(demoUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (email === 'user@roadportal.com' && password === 'user123') {
        const demoUser: User = {
          id: 'demo-user',
          email: 'user@roadportal.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'USER' as any,
          isActive: true,
          phone: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fcmToken: null,
        };
        await persistDemoAuth(demoUser);
      } else {
        throw new Error('Invalid credentials for demo mode');
      }
    },
    [persistDemoAuth]
  );

  const register = useCallback(
    async () => {
      throw new Error('Registration is disabled in demo mode');
    },
    []
  );

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const registerFcmToken = useCallback(async () => {
    // No-op in demo mode; kept for API compatibility
    return;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      restoreSession,
      registerFcmToken,
    }),
    [user, isLoading, isAuthenticated, login, register, logout, restoreSession, registerFcmToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
