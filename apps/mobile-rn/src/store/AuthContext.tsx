import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/authApi';
import { fcmApi } from '../api/fcmApi';
import { setApiTokenGetter } from '../api/apiClient';
import type { User } from '@margwatch/shared-types';

const TOKEN_KEY = '@margwatch_token';
const USER_KEY = '@margwatch_user';

export interface AuthState {
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const persistAuth = useCallback(async (newToken: string, newUser: User) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, newToken],
      [USER_KEY, JSON.stringify(newUser)],
    ]);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
      const t = storedToken[1];
      const u = storedUser[1] ? JSON.parse(storedUser[1]) : null;
      if (t && u) {
        setToken(t);
        setUser(u);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    setApiTokenGetter(() => token);
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login({ email, password });
      if (!data.success || !data.data?.user || !data.data?.token) {
        throw new Error(data.message || 'Login failed');
      }
      const { user: u, token: t } = data.data;
      await persistAuth(t, u as User);
    },
    [persistAuth]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      phone?: string
    ) => {
      const { data } = await authApi.register({
        email,
        password,
        firstName,
        lastName,
        phone,
      });
      if (!data.success || !data.data?.user || !data.data?.token) {
        throw new Error(data.message || 'Registration failed');
      }
      const { user: u, token: t } = data.data;
      await persistAuth(t, u as User);
    },
    [persistAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    await clearAuth();
  }, [clearAuth]);

  const registerFcmToken = useCallback(async (fcmToken: string) => {
    try {
      await fcmApi.registerToken(fcmToken);
    } catch (e) {
      console.warn('FCM token registration failed:', e);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      restoreSession,
      registerFcmToken,
    }),
    [
      token,
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      restoreSession,
      registerFcmToken,
    ]
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
