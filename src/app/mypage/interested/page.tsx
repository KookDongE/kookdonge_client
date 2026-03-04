'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { ClubType } from '@/types/api';
import { useMyWaitingList } from '@/features/waiting-list/hooks';
import { ClubCardSkeleton } from '@/components/common/club-card';
import { DefaultClubImage } from '@/components/common/default-club-image';

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학회',
  CLUB: '소모임',
};

function InterestedClubsContent() {
  const { data: subscriptions, isLoading } = useMyWaitingList();
  const list = subscriptions ?? [];

  return (
    <div className="pb-6">
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ClubCardSkeleton key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>관심 동아리가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((club) => (
              <Link
                key={club.clubId}
                href={`/clubs/${club.clubId}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
                  {club.clubProfileImageUrl ? (
                    <Image
                      src={club.clubProfileImageUrl}
                      alt={club.clubName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <DefaultClubImage className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      {TYPE_LABEL[club.clubType]}
                    </span>
                  </div>
                  <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                    {club.clubName}
                  </h4>
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterestedClubsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-4 py-4">
          {[1, 2, 3].map((i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <InterestedClubsContent />
    </Suspense>
  );
}
