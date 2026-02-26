import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

import { QueryProvider } from '@/lib/query/provider';
import { ThemeProvider } from '@/lib/theme/provider';
import { AuthProvider } from '@/features/auth';
import { BottomNav } from '@/components/common/bottom-nav';
import { Header } from '@/components/common/header';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'KookDongE',
  description: '국민대학교 동아리 정보 플랫폼',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <NuqsAdapter>
            <QueryProvider>
              <AuthProvider>
                <div className="relative mx-auto min-h-dvh max-w-md bg-[var(--card)] shadow-xl">
                  <Header />
                  <main className="pb-safe">{children}</main>
                  <BottomNav />
                </div>
                <Toaster position="top-center" richColors />
              </AuthProvider>
            </QueryProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
