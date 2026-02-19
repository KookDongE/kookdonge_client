'use client';

import { ReactNode, useEffect } from 'react';

import { useAuthStore } from './store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    // 임시: 인증 로직 비활성화 (모든 페이지 공개 접근)
    if (!isInitialized) {
      setInitialized(true);
    }
  }, [isInitialized, setInitialized]);

  return <>{children}</>;
}
