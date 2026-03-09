'use client';

import { usePathname } from 'next/navigation';

/**
 * 레이아웃(헤더 표시, main 패딩 등) 판단용 pathname.
 * 웹뷰 등에서 usePathname()이 URL보다 한 틱 늦게 갱신되어
 * 뒤로가기 시 헤더와 본문이 겹치는 현상을 방지하기 위해
 * 클라이언트에서는 실제 URL(window.location.pathname)을 우선 사용한다.
 */
export function useEffectivePathname(): string {
  const pathname = usePathname() ?? '';
  if (typeof window === 'undefined') return pathname;
  return window.location.pathname || pathname;
}
