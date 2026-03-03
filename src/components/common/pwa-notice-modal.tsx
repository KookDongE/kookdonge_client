'use client';

import { useEffect, useState } from 'react';

const PWA_NOTICE_DISMISSED_KEY = 'kookdonge-pwa-notice-dismissed';

function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return true; // SSR: don't show modal
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || fullscreen || iosStandalone;
}

export function PwaNoticeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isRunningAsPWA()) return;
    try {
      if (sessionStorage.getItem(PWA_NOTICE_DISMISSED_KEY) === 'true') return;
    } catch {
      // ignore
    }
    const id = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(id);
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(PWA_NOTICE_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-notice-title"
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800"
      >
        <h2
          id="pwa-notice-title"
          className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100"
        >
          앱처럼 사용해 보세요
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          KookDongE을 홈 화면에 추가하면 앱처럼 더 편하게 이용할 수 있어요. 동아리 알림도 받을 수
          있습니다.
        </p>
        <div className="mb-6 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">· Android (Chrome)</p>
          <p className="pl-2">
            오른쪽 상단 메뉴 탭 → 홈화면에추가 또는 앱설치 선택 → 추가(설치) 확인
          </p>
          <p className="font-medium text-zinc-800 dark:text-zinc-200">· iOS (Safari)</p>
          <p className="pl-2">공유버튼 목록에서 홈화면에 추가</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-full rounded-xl bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
        >
          확인
        </button>
      </div>
    </div>
  );
}
