import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { authApi } from '../lib/api';
import type { User, LoginRequest, RegisterRequest } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

/**
 * Authentication store using Zustand
 * Persists user data to localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login user
       */
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(credentials);

          // Store token in localStorage for API clients
          localStorage.setItem('auth_token', response.access_token);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response.user;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error && 'response' in error
              ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
                'Login failed. Please try again.'
              : 'Login failed. Please try again.';

          // Clear token on error
          localStorage.removeItem('auth_token');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.register(data);

          // Store token in localStorage for API clients
          localStorage.setItem('auth_token', response.access_token);

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response.user;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error && 'response' in error
              ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
                'Registration failed. Please try again.'
              : 'Registration failed. Please try again.';

          // Clear token on error
          localStorage.removeItem('auth_token');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear token from localStorage
          localStorage.removeItem('auth_token');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Refresh user data
       */
      refreshUser: async () => {
        set({ isLoading: true });

        try {
          const user = await authApi.me();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          console.error('Failed to refresh user:', error);

          // Clear token on refresh failure
          localStorage.removeItem('auth_token');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set user manually (for testing or SSR)
       */
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
