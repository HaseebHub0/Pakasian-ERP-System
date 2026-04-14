import { create } from 'zustand';
import client from '../api/client';

export interface User {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  hasPermission: (module: string, action?: string) => boolean;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (credentials) => {
    const response = await client.post('/api/auth/login/', credentials);
    const { access_token, refresh_token, user } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    
    set({
      user,
      token: access_token,
      refreshToken: refresh_token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  hasPermission: (module, action) => {
    const { user } = get();
    // Allow everything if user role is Admin (or adjust as needed)
    if (user?.role?.toLowerCase() === 'admin') return true;
    if (!user || !user.permissions?.length) return false;
    
    const requiredPermission = action ? `${module}.${action}` : module;
    return user.permissions.some(p => p === requiredPermission || p.startsWith(`${module}.`));
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
       set({ isAuthenticated: false, user: null });
       return;
    }
    
    try {
      const response = await client.get('/api/auth/me/');
      set({ user: response.data, isAuthenticated: true });
    } catch (error) {
      // 401 interceptor will handle the actual logout propagation
      get().logout();
    }
  },
}));
