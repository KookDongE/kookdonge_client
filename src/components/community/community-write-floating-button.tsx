'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';

const WRITE_HREF = '/admin/community/write';

export function CommunityWriteFloatingButton() {
  const router = useRouter();
  return (
    <div
      className="fixed right-4 bottom-24 z-40 rounded-full border border-zinc-200/80 bg-white/95 shadow-lg backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95"
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
