'use client';

import { useEffect } from 'react';

function isAppView(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || fullscreen || iosStandalone;
}

/**
 * PWA/앱 뷰(standalone)에서 화면을 세로(portrait)로 고정.
 * manifest의 orientation: 'portrait'와 함께, 지원하는 환경에서는 Screen Orientation API로 보강.
 */
export function PortraitLock() {
  useEffect(() => {
    if (!isAppView()) return;
    const screen = window.screen as Screen & {
      orientation?: { lock?: (mode: string) => Promise<void> };
    };
    if (typeof screen.orientation?.lock !== 'function') return;
    screen.orientation.lock('portrait').catch(() => {
      // 지원하지 않거나 권한 없음 시 무시 (manifest portrait에 의존)
    });
    return () => {
      try {
        screen.orientation?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return null;
}
