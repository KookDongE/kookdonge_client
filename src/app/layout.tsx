import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

import { QueryProvider } from '@/lib/query/provider';
import { ThemeProvider } from '@/lib/theme/provider';
import { AuthProvider } from '@/features/auth';
import { FcmForegroundHandler } from '@/features/notifications/fcm-foreground-handler';
import { AppShell } from '@/components/common/app-shell';
import { PwaNoticeModal } from '@/components/common/pwa-notice-modal';
import { PwaNotificationPromptModal } from '@/components/common/pwa-notification-prompt-modal';

import '@/styles/globals.css';

const appUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : undefined;
const appBase = typeof appUrl === 'string' ? appUrl.replace(/\/$/, '') : '';
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
      {
        url: `${iconBase}/icons/icon-light-192.png`,
        sizes: '192x192',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${iconBase}/icons/icon-light-512.png`,
        sizes: '512x512',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${iconBase}/icons/icon-dark-192.png`,
        sizes: '192x192',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: `${iconBase}/icons/icon-dark-512.png`,
        sizes: '512x512',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [
      {
        url: `${iconBase}/icons/icon-light-192.png`,
        sizes: '192x192',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: `${iconBase}/icons/icon-dark-192.png`,
        sizes: '192x192',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
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

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <NuqsAdapter>
            <QueryProvider>
              <AuthProvider>
                <FcmForegroundHandler />
                <AppShell>{children}</AppShell>
                <Toaster position="top-center" richColors />
                <PwaNoticeModal />
                <PwaNotificationPromptModal />
              </AuthProvider>
            </QueryProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
