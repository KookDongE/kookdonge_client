'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { useAuthStore } from '@/features/auth/store';
import { getPlatform } from '@/features/device/platform';

const PWA_NOTICE_DISMISSED_KEY = 'kookdonge-pwa-notice-dismissed';

function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return true; // SSR: don't show modal
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || fullscreen || iosStandalone;
}

export function PwaNoticeModal() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [hasInstallPrompt, setHasInstallPrompt] = useState(false);
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
    try {
      if (sessionStorage.getItem(PWA_NOTICE_DISMISSED_KEY) === 'true') return;
    } catch {
      // ignore
    }
    const id = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(id);
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

  const isIOS = getPlatform() === 'IOS';

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
        className="relative z-10 w-full rounded-t-2xl bg-white pt-4 pb-[env(safe-area-inset-bottom)] shadow-xl dark:bg-zinc-800"
      >
        <div className="mx-auto mb-4 h-1 w-12 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <div className="px-5 pb-5">
          <h2
            id="pwa-notice-title"
            className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100"
          >
            앱처럼 사용해 보세요
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            KookDongE을 홈 화면에 추가하면 앱처럼 더 편하게 이용할 수 있어요. 동아리 알림도 받을 수
            있습니다.
          </p>
          {!isIOS && (
            <div className="mb-4 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">· Android (Chrome)</p>
              <p className="pl-2">
                오른쪽 상단 메뉴 탭 → 홈화면에추가 또는 앱설치 선택 → 추가(설치) 확인
              </p>
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                · 데스크톱 (Chrome/Edge)
              </p>
              <p className="pl-2">주소창 오른쪽 설치 아이콘 또는 메뉴에서 앱 설치</p>
            </div>
          )}
          {isIOS && (
            <div className="mb-4 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">· iOS (Safari)</p>
              <p className="pl-2">공유 버튼 목록에서 홈 화면에 추가</p>
            </div>
          )}
          {isIOS ? (
            <Link
              href="/pwa-guide"
              onClick={handleClose}
              className="mb-3 flex w-full items-center justify-center rounded-xl bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
            >
              가이드 보러가기
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing || !hasInstallPrompt}
              className="mb-3 w-full rounded-xl bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300 disabled:dark:opacity-70"
            >
              {installing ? '설치 중…' : '설치'}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            괜찮아요 웹으로 볼게요
          </button>
        </div>
      </div>
    </div>
  );
}
