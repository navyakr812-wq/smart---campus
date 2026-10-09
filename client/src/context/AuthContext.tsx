import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; studentId?: string; department?: string }) => Promise<void>;
  logout: () => void;
  loginDemo: (role: 'student' | 'student2' | 'faculty' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campusnow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      if (!localStorage.getItem('campusnow_token')) {
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('[AUTH] Token validation failed, clearing session.');
      localStorage.removeItem('campusnow_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('campusnow_token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast(`Welcome back, ${data.user.name}!`, `Signed in as ${data.user.role}`, 'success');
    } catch (err: any) {
      addToast('Login Failed', err.message || 'Invalid credentials', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string; studentId?: string; department?: string }) => {
    setIsLoading(true);
    try {
      const data = await api.register(payload);
      localStorage.setItem('campusnow_token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast('Account Created!', `Welcome to CampusNow, ${data.user.name}!`, 'success');
    } catch (err: any) {
      addToast('Registration Failed', err.message || 'Could not complete registration', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('campusnow_token');
    setToken(null);
    setUser(null);
    addToast('Signed Out', 'You have been logged out successfully.', 'info');
  };

  const loginDemo = async (role: 'student' | 'student2' | 'faculty' | 'admin') => {
    const demoCredentials: Record<string, { email: string; password: string }> = {
      student: { email: 'student@campus.test', password: 'CampusNow2026!' },
      student2: { email: 'student2@campus.test', password: 'CampusNow2026!' },
      faculty: { email: 'faculty@campus.test', password: 'CampusNow2026!' },
      admin: { email: 'admin@campus.test', password: 'CampusNow2026!' },
    };

    const creds = demoCredentials[role];
    if (creds) {
      await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
