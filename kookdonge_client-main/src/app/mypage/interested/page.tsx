'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Chip, Spinner } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubType } from '@/types/api';
import { useInterestedStore } from '@/features/club/interested-store';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
};

export default function InterestedClubsPage() {
  const [q] = useQueryState('q', parseAsString.withDefault(''));
  const [clubType] = useQueryState('clubType', parseAsString.withDefault(''));
  const clubs = useInterestedStore((s) => s.getList());

  let filtered = clubs;
  if (q) {
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(q.trim().toLowerCase())
    );
  }
  if (clubType && clubType !== 'ALL') {
    filtered = filtered.filter((c) => c.type === clubType);
  }

  return (
    <div className="pb-6">
      <SearchFilterBar stickyHideOnScroll placeholder="동아리명 검색" />
      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>{q || clubType ? '검색 결과가 없습니다.' : '관심 동아리가 없습니다.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
                  {club.logoImage ? (
                    <Image
                      src={club.logoImage}
                      alt={club.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-400 dark:text-zinc-500">
                      🏠
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                    {club.name}
                  </h4>
                  <div className="mt-1">
                    <Chip size="sm" color="accent" variant="soft">
                      {TYPE_LABEL[club.type]}
                    </Chip>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
