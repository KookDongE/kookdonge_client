'use client';

import { ReactNode, useEffect } from 'react';

import { useAuthStore } from './store';
import { AuthGuard } from './auth-guard';

export function AuthProvider({ children }: { children: ReactNode }) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  useEffect(() => {
    if (!isInitialized) {
      setInitialized(true);
    }
  }, [isInitialized, setInitialized]);

  return <AuthGuard>{children}</AuthGuard>;
}
