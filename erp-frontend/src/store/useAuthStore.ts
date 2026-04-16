import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string; // Changed to string as backend returns UUID or string
  email?: string;
  username: string; // Added username as it matches backend
  name?: string;
  role: string | null; // Make it null if not present
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('erp_token', token);
        localStorage.setItem('erp_refresh_token', refreshToken);
        set({ user, token, refreshToken });
      },
      updateTokens: (token, refreshToken) => {
        localStorage.setItem('erp_token', token);
        if (refreshToken) {
          localStorage.setItem('erp_refresh_token', refreshToken);
        }
        set((state) => ({ 
          token, 
          refreshToken: refreshToken || state.refreshToken 
        }));
      },
      logout: () => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh_token');
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: 'erp-auth-storage',
    }
  )
);
