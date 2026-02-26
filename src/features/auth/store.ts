import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserProfileRes } from '@/types/api';

/** 로그인 여부는 accessToken 존재 여부로 판단합니다. AuthGuard·API 클라이언트 모두 이 값을 사용합니다. */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfileRes | null;
  isInitialized: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserProfileRes | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

const DEFAULT_STATE: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isInitialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      clearAuth: () => set({ ...DEFAULT_STATE, isInitialized: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
