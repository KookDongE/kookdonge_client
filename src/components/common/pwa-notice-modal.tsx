'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { useAuthStore } from '@/features/auth/store';
import { getPlatform } from '@/features/device/platform';

const PWA_NOTICE_DISMISSED_KEY = 'kookdonge-pwa-notice-dismissed';
const PWA_NOTICE_LAST_LOGIN_KEY = 'kookdonge-pwa-notice-last-login';

function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return true; // SSR: don't show modal
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || fullscreen || iosStandalone;
}

/** getInstalledRelatedApps()로 웹뷰에서 PWA 설치 여부 확인 (Chrome/Edge 등에서 지원) */
async function isPWAInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<{ url?: string }[]>;
  };
  if (typeof nav.getInstalledRelatedApps !== 'function') return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.length > 0;
  } catch {
    return false;
  }
}

function getAppLaunchUrl(): string {
  if (typeof window === 'undefined') return '/';
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (base && typeof base === 'string') return base.replace(/\/$/, '') || window.location.origin;
  return window.location.origin;
}

export function PwaNoticeModal() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [hasInstallPrompt, setHasInstallPrompt] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      deferredPromptRef.current = promptEvent;
      setHasInstallPrompt(true);
    };
    const eventName = 'beforeinstallprompt' as keyof WindowEventMap;
    window.addEventListener(eventName, handler as EventListener);
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
      deferredPromptRef.current = null;
      setHasInstallPrompt(false);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    if (isRunningAsPWA()) return;
    let cancelled = false;
    (async () => {
      try {
        const dismissed = sessionStorage.getItem(PWA_NOTICE_DISMISSED_KEY) === 'true';
        const lastLogin = sessionStorage.getItem(PWA_NOTICE_LAST_LOGIN_KEY);
        if (dismissed && lastLogin === accessToken) return;
        const installed = await isPWAInstalled();
        if (!cancelled) setPwaInstalled(installed);
        sessionStorage.setItem(PWA_NOTICE_LAST_LOGIN_KEY, accessToken);
        if (!cancelled) setOpen(true);
      } catch {
        if (!cancelled) {
          try {
            sessionStorage.setItem(PWA_NOTICE_LAST_LOGIN_KEY, accessToken);
          } catch {
            // ignore
          }
          setOpen(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleClose = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(PWA_NOTICE_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') handleClose();
    } finally {
      setInstalling(false);
    }
  }, [handleClose]);

  const handleOpenInApp = useCallback(() => {
    handleClose();
    window.location.href = getAppLaunchUrl();
  }, [handleClose]);

  const platform = getPlatform();
  const isIOS = platform === 'IOS';
  const isAndroid = platform === 'ANDROID';
  const isDesktop = platform === 'WEB';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        aria-hidden
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-notice-title"
        className="relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-white pt-4 pb-[env(safe-area-inset-bottom)] dark:bg-zinc-800"
      >
        <div className="mx-auto mb-5 h-1 w-12 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <div className="px-6 pt-1 pb-6">
          <h2
            id="pwa-notice-title"
            className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100"
          >
            앱처럼 사용해 보세요
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            국동이를 홈 화면에 추가하여 알림을 받을 수 있습니다.
          </p>
          {isIOS && (
            <div className="mb-5 rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">· iOS (Safari)</p>
              <p className="mt-1 pl-2">
                Safari 하단의 공유 버튼을 누른 뒤, 아래로 스크롤하여 「홈 화면에 추가」를 탭하고
                오른쪽 상단 「추가」를 눌러주세요.
              </p>
            </div>
          )}
          {isAndroid && (
            <div className="mb-5 rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">· Android (Chrome)</p>
              <p className="mt-1 pl-2">
                아래 설치 버튼 또는 오른쪽 상단 메뉴 탭 → 홈화면에추가 또는 앱설치 선택 → 추가(설치)
                확인
              </p>
            </div>
          )}
          {isDesktop && (
            <div className="mb-5 rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                · 데스크톱 (Chrome/Edge)
              </p>
              <p className="mt-1 pl-2">
                아래 설치 버튼 또는 주소창 오른쪽 설치 아이콘 또는 메뉴에서 앱 설치
              </p>
            </div>
          )}
          <div className="mt-2">
            {isIOS ? (
              <Link
                href="/pwa-guide"
                onClick={handleClose}
                className="mb-4 flex w-full items-center justify-center rounded-xl bg-blue-500 py-3.5 font-semibold text-white transition-colors hover:bg-blue-600 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
              >
                가이드 보러가기
              </Link>
            ) : pwaInstalled || !hasInstallPrompt ? (
              <button
                type="button"
                onClick={handleOpenInApp}
                className="mb-4 w-full rounded-xl bg-blue-500 py-3.5 font-semibold text-white transition-colors hover:bg-blue-600 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
              >
                홈 화면의 국동이 앱 아이콘을 눌러 실행해 주세요.
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="mb-4 w-full rounded-xl bg-blue-500 py-3.5 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300 disabled:dark:opacity-70"
              >
                {installing ? '설치 중…' : '설치'}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              괜찮아요 웹으로 볼게요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
