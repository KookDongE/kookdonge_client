'use client';

import { ReactNode, useEffect } from 'react';

import { AuthGuard } from './auth-guard';
import { useAuthStore } from './store';

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  return <AuthGuard>{children}</AuthGuard>;
}
