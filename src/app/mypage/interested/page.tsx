'use client';

import { Suspense } from 'react';

import { useMyInterests } from '@/features/interest/hooks';
import { InterestedClubCard } from '@/components/club/interested-club-card';
import { ClubCardSkeleton } from '@/components/common/club-card';

function InterestedClubsContent() {
  const { data: interests, isLoading } = useMyInterests();
  const list = interests ?? [];

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
            <p className="text-sm">관심 동아리가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((club) => (
              <InterestedClubCard key={club.clubId} subscription={club} />
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
