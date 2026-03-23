'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

import { Chip } from '@heroui/react';

import { useMyWaitingList } from '@/features/waiting-list/hooks';
import { ListCardSkeleton } from '@/components/common/skeletons';

function WaitingListContent() {
  const router = useRouter();
  const { data: waitingList, isLoading } = useMyWaitingList();

  const list = waitingList || [];

  return (
    <div className="pb-6">
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>답변 대기 목록이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((club) => (
              <button
                type="button"
                key={club.clubId}
                onClick={() => club.clubId != null && router.push(`/clubs/${club.clubId}`)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
              >
                <div className="flex items-start gap-3">
                  <Chip size="sm" color="accent" variant="primary" className="shrink-0">
                    Q
                  </Chip>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {club.clubName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WaitingListPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-4 py-4">
          {[1, 2, 3].map((i) => (
            <ListCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <WaitingListContent />
    </Suspense>
  );
}
