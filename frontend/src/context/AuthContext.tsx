import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, LoginData, RegisterData, User } from '../types/auth';
import { authStorage } from '../storage/authStorage';
import { fetchCurrentUserApi, loginApi, registerApi } from '../services/api/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authentication session from storage on app boot
  const restoreAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = await authStorage.getToken();
      const storedUser = await authStorage.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Verify token against /api/v1/users/me in the background
        try {
          const freshUser = await fetchCurrentUserApi(storedToken);
          setUser(freshUser);
          await authStorage.saveAuth(storedToken, freshUser);
        } catch {
          // If token verification fails (e.g., token expired), clear stale state
          await authStorage.clearAuth();
          setToken(null);
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const auth = await loginApi(data);
      await authStorage.saveAuth(auth.token, auth.user);
      setToken(auth.token);
      setUser(auth.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const auth = await registerApi(data);
      await authStorage.saveAuth(auth.token, auth.user);
      setToken(auth.token);
      setUser(auth.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authStorage.clearAuth();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const freshUser = await fetchCurrentUserApi(token);
      setUser(freshUser);
      await authStorage.saveAuth(token, freshUser);
    } catch {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
