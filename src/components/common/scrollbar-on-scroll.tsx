'use client';

import { useEffect } from 'react';

const VISIBLE_CLASS = 'scrollbar-visible';
const HIDE_DELAY_MS = 1000;

const timeouts = new Map<Element, ReturnType<typeof setTimeout>>();

function scheduleHide(el: Element) {
  const existing = timeouts.get(el);
  if (existing) clearTimeout(existing);
  const id = setTimeout(() => {
    el.classList.remove(VISIBLE_CLASS);
    timeouts.delete(el);
  }, HIDE_DELAY_MS);
  timeouts.set(el, id);
}

/**
 * 스크롤 시에만 스크롤바가 보이도록 스크롤 대상 요소에 클래스를 토글합니다.
 * (웹뷰/윈도우 등에서 항상 보이던 스크롤바를 스크롤할 때만 표시)
 */
export function ScrollbarOnScroll() {
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || target === document.documentElement) return;
      target.classList.add(VISIBLE_CLASS);
      scheduleHide(target);
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  return null;
}
