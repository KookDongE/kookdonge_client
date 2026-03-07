'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';

import { usePullToRefreshActive } from '@/components/common/pull-to-refresh';

const WRITE_HREF = '/community/write';

const emptySubscribe = () => () => {};

/** 앱 뷰 안에서만 보이도록 body 포탈 없이 인라인 렌더 (app-shell의 max-w-md overflow-hidden에 의해 웹에서 앱 열 밖은 잘림) */
export function CommunityWriteFloatingButton() {
  const router = useRouter();
  const isPullActive = usePullToRefreshActive();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient || isPullActive) return null;

  return (
    <div
      className="fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] z-[100] rounded-full border border-zinc-200/80 bg-white/95 backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95"
      aria-hidden
    >
      <Button
        size="sm"
        className="min-w-0 rounded-full px-4 py-2 text-sm font-semibold"
        variant="primary"
        onPress={() => router.push(WRITE_HREF)}
      >
        글쓰기
      </Button>
    </div>
  );
}
