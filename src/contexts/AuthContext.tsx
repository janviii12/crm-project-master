import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../lib/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Howl, Howler } from 'howler';
import { useAIEmotion } from '../hooks/useAIEmotion';

export type UserRole = string;

interface User {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
  avatar?: string;
  isDevLead?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Set backend API base URL
    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
    // ✅ Check for stored token
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/api/login', { email, password });
      const { accessToken, user: userData } = response.data;
      // ✅ Store data
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Invalid credentials');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Resume audio context if suspended
    if (Howler.ctx?.state === 'suspended') {
      Howler.ctx.resume();
    }

    // Play logout sound using emotion hook
    const { playEmotion } = useAIEmotion();
    playEmotion("logout");

    // Clear data immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);

    // Show logout message with fade-out
    toast.info('Logging out safely… see you soon 👋', {
      duration: 2000,
      onDismiss: () => {
        // Redirect after toast
        navigate('/login');
      }
    });
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
    if (userData) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export logout function for use in axiosInstance
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = '/login';
};
