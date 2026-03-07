'use client';

import { Suspense } from 'react';
import Link from 'next/link';

import { Chip } from '@heroui/react';

import { ListCardSkeleton } from '@/components/common/skeletons';
import { useMyApplications } from '@/features/club/hooks';

function MyApplicationsListContent() {
  const { data: applications, isLoading } = useMyApplications();

  const list = applications || [];

  return (
    <div className="pb-6">
      <div className="px-4 py-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          동아리 및 소모임 신청
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>신청한 동아리가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((app) => (
              <Link
                key={app.id}
                href={`/my/club-requests/${app.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition hover:border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                    {app.name}
                  </h4>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                    신청일: {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Chip
                  size="sm"
                  color={
                    app.status === 'PENDING'
                      ? 'warning'
                      : app.status === 'APPROVED'
                        ? 'success'
                        : 'danger'
                  }
                  variant="soft"
                  className="shrink-0"
                >
                  {app.status === 'PENDING'
                    ? '대기중'
                    : app.status === 'APPROVED'
                      ? '승인됨'
                      : '반려됨'}
                </Chip>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyApplicationsListPage() {
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
      <MyApplicationsListContent />
    </Suspense>
  );
}
