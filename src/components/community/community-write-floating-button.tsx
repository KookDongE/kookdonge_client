'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';
import { createPortal } from 'react-dom';

const WRITE_HREF = '/admin/community/write';

const emptySubscribe = () => () => {};

export function CommunityWriteFloatingButton() {
  const router = useRouter();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const button = (
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

  if (!isClient) return null;
  return createPortal(button, document.body);
}
