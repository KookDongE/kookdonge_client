'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';

/** 동아리 관리 피드 탭에서만 노출. fixed 우측 하단. 풀리프레시/스크롤과 무관하게 고정 (AppShell 바깥 레이어에서 렌더). */
export function FeedAddFloatingButton({ clubId }: { clubId: number }) {
  const router = useRouter();

  return (
    <div
      className="fixed right-4 bottom-[calc(4rem+2.5rem+env(safe-area-inset-bottom,0px))] z-[100] rounded-full bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95"
      aria-hidden
    >
      <Button
        size="sm"
        className="min-w-0 rounded-full px-4 py-2 text-sm font-semibold"
        variant="primary"
        onPress={() => router.push(`/mypage/clubs/${clubId}/manage/feed/new`)}
      >
        피드 추가
      </Button>
    </div>
  );
}
