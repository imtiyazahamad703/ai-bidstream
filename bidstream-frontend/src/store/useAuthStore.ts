import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: number;
  email: string;
  role: 'BIDDER' | 'SELLER' | 'ADMIN';
}

interface JwtPayload {
  sub: string;
  userId: number;
  role: string;
  exp: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  checkSession: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem('auth_token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Token valid, fetch real user details
        const { authApi } = await import('../api/authApi');
        try {
          const user = await authApi.getUserProfile();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          localStorage.removeItem('auth_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
