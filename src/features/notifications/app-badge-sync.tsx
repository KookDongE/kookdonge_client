'use client';

import { useEffect } from 'react';

import { useUnreadCount } from './hooks';

/**
 * PWA 앱 아이콘 배지 동기화.
 * 로그인 사용자의 읽지 않은 알림 개수를 Badging API로 앱 아이콘에 표시한다.
 * - Chrome/Edge(설치된 PWA), iPadOS 16.4+ Safari 등에서 동작.
 * - Android: Badging API 미지원이지만, 푸시 알림이 오면 OS가 아이콘에 배지를 띄우는 경우가 많음.
 */
export function AppBadgeSync() {
  const { data: unreadCount = 0 } = useUnreadCount();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.setAppBadge) return;

    const sync = async () => {
      try {
        if (unreadCount > 0) {
          await navigator.setAppBadge?.(Math.min(unreadCount, 99));
        } else {
          await navigator.clearAppBadge?.();
        }
      } catch {
        // 권한 없음·미지원 환경 등에서 무시
      }
    };

    sync();
  }, [unreadCount]);

  return null;
}
