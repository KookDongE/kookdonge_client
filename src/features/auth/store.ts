import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { UserProfileRes } from '@/types/api';

export const AUTH_STORAGE_KEY = 'auth-storage';

type PersistedAuth = {
  state: { accessToken: string | null; refreshToken: string | null };
  version?: number;
};

/** localStorage에 저장된 토큰을 읽습니다. (AuthGuard는 스토어만 신뢰하므로, 필요 시 스플래시 등 외부에서만 사용) */
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

/** 재수화가 끝나기 전에는 setItem을 하지 않아, 초기 상태(null)가 저장된 토큰을 덮어쓰지 않도록 함 */
let hasRehydrated = false;

/** 저장하려는 값이 토큰이 둘 다 null이면 쓰지 않음. (재수화 후 비동기로 null이 쓰이는 것 방지) */
function shouldSkipWrite(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as PersistedAuth;
    const accessToken = parsed?.state?.accessToken;
    const refreshToken = parsed?.state?.refreshToken;
    return accessToken == null && refreshToken == null;
  } catch {
    return false;
  }
}

/** SSR 시 localStorage 없음 처리. 클라이언트에서는 재수화 전·null 덮어쓰기 모두 막음 */
function getAuthStorage(): Storage {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      length: 0,
      key: () => null,
      clear: () => {},
    } as Storage;
  }
  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      if (!hasRehydrated) return;
      if (shouldSkipWrite(value)) return;
      localStorage.setItem(key, value);
    },
    removeItem: (key: string) => localStorage.removeItem(key),
    get length() {
      return localStorage.length;
    },
    key: (index: number) => localStorage.key(index),
    clear: () => localStorage.clear(),
  } as Storage;
}

/** 로그인 여부는 accessToken 존재 여부로 판단합니다. AuthGuard·API 클라이언트 모두 이 값을 사용합니다. */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfileRes | null;
  isInitialized: boolean;
}

export interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserProfileRes | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

/** persist partialize로 localStorage에 저장되는 필드만 정의 */
type PersistedAuthState = Pick<AuthState, 'accessToken' | 'refreshToken'>;

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
      storage: createJSONStorage(getAuthStorage),
      partialize: (state): PersistedAuthState => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      /** rehydrate()가 완료된 뒤에만 호출됨. 여기서 setInitialized(true)로 Hydration Shield 해제 */
      onRehydrateStorage: () => (state) => {
        hasRehydrated = true;
        state?.setInitialized(true);
      },
      /** SSR 시 자동 재수화 비활성화. 클라이언트에서 AuthProvider의 useEffect에서 rehydrate() 호출 */
      skipHydration: true,
    }
  )
);
