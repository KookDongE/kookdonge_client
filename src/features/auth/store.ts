import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserProfileRes } from '@/types/api';

export const AUTH_STORAGE_KEY = 'auth-storage';

type PersistedAuth = { state: { accessToken: string | null; refreshToken: string | null }; version?: number };

/** localStorage에 저장된 토큰을 읽습니다. 재수화 전 AuthGuard 등에서 사용 */
export function getStoredTokens(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    const accessToken = parsed?.state?.accessToken;
    const refreshToken = parsed?.state?.refreshToken;
    if (accessToken && refreshToken) return { accessToken, refreshToken };
    return null;
  } catch {
    return null;
  }
}

type PersistedState = { accessToken: string | null; refreshToken: string | null };

/** Zustand v5 PersistStorage: getItem은 StorageValue 객체 반환, setItem은 객체 수신 후 직렬화 저장 */
function createAuthStorage(): import('zustand/middleware').PersistStorage<PersistedState> {
  return {
    getItem: (name: string): PersistedAuth | null => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as PersistedAuth) : null;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: PersistedAuth): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
    },
  };
}

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
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
        set({ ...DEFAULT_STATE, isInitialized: true });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createAuthStorage(),
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
