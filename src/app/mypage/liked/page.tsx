'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Spinner } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubType, RecruitmentStatus } from '@/types/api';
import { useLikedClubs } from '@/features/club/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학회',
  CLUB: '소모임',
};

const CATEGORY_LABEL: Record<ClubCategory, string> = {
  PERFORMING_ARTS: '공연예술',
  LIBERAL_ARTS_SERVICE: '교양봉사',
  EXHIBITION_ARTS: '전시창작',
  RELIGION: '종교',
  BALL_LEISURE: '구기레저',
  PHYSICAL_MARTIAL_ARTS: '체육무예',
  ACADEMIC: '학술',
};

const STATUS_CONFIG: Record<RecruitmentStatus, { label: string; className: string }> = {
  RECRUITING: {
    label: '모집중',
    className: 'bg-lime-200 text-zinc-800 dark:bg-lime-500/70 dark:text-zinc-900',
  },
  SCHEDULED: {
    label: '모집예정',
    className: 'bg-cyan-200 text-zinc-800 dark:bg-cyan-500/70 dark:text-zinc-900',
  },
  CLOSED: {
    label: '마감',
    className: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400',
  },
};

function LikedClubsListContent() {
  const [q] = useQueryState('q', parseAsString.withDefault(''));
  const [clubType] = useQueryState('clubType', parseAsString.withDefault(''));
  const { data: likedClubs, isLoading } = useLikedClubs();

  const list = likedClubs || [];
  let filtered = list;
  if (q) {
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  }
  if (clubType && clubType !== 'ALL') {
    filtered = filtered.filter((c) => c.type === clubType);
  }

  return (
    <div className="pb-6">
      <SearchFilterBar stickyHideOnScroll placeholder="동아리명 검색" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>{q || clubType ? '검색 결과가 없습니다.' : '좋아요한 동아리가 없습니다.'}</p>
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
                    <DefaultClubImage className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    {club.recruitmentStatus && (
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CONFIG[club.recruitmentStatus].className}`}
                      >
                        {STATUS_CONFIG[club.recruitmentStatus].label}
                      </span>
                    )}
                    <span className="mypage-club-tag-type rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-zinc-800 dark:text-zinc-400">
                      {TYPE_LABEL[club.type]}
                    </span>
                    {club.category && (
                      <span className="mypage-club-tag-category rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {CATEGORY_LABEL[club.category]}
                      </span>
                    )}
                  </div>
                  <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                    {club.name}
                  </h4>
                </div>
                <svg
                  className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
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

export default function LikedClubsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <LikedClubsListContent />
    </Suspense>
  );
}
