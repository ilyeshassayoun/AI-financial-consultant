import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
      login: ({ user, access_token, refresh_token }) => set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateTokens: ({ access_token, refresh_token, user }) => set((state) => ({ accessToken: access_token, refreshToken: refresh_token, user: user || state.user, isAuthenticated: true })),
      getAccessToken: () => get().accessToken,
    }),
    { name: 'financial-consultant-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }) }
  )
);
