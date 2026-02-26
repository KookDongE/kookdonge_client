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

const appBase = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, '') ?? '';
const iconBase = appBase || '';

export const metadata: Metadata = {
  title: 'KookDongE',
  description: '국민대 동아리 정보 모음이',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KookDongE',
  },
  icons: {
    icon: [
      { url: `${iconBase}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${iconBase}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: `${iconBase}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
    ],
  },
  themeColor: '#3B82F6',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3B82F6',
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
