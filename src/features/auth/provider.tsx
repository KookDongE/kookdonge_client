'use client';

import { ReactNode } from 'react';

import { AuthGuard } from './auth-guard';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
