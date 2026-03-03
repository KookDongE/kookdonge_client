'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { ClubCategory, ClubType, College, RecruitmentStatus } from '@/types/api';
import { ClubCardSkeleton } from '@/components/common/club-card';
import { useLikedClubs } from '@/features/club/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학회',
  CLUB: '소모임',
};

const COLLEGE_LABEL: Record<College, string> = {
  GLOBAL_HUMANITIES: '글로벌인문지역대학',
  SOCIAL_SCIENCE: '사회과학대학',
  LAW: '법과대학',
  ECONOMICS: '경상대학',
  BUSINESS: '경영대학',
  FREE_MAJOR: '자유전공',
  ENGINEERING: '창의공과대학',
  SOFTWARE: '소프트웨어융합대학',
  AUTOMOTIVE: '자동차융합대학',
  SCIENCE: '과학기술대학',
  ARCHITECTURE: '건축대학',
  DESIGN: '조형대학',
  ARTS: '예술대학',
  PHYSICAL_EDUCATION: '체육대학',
  FUTURE_MOBILITY: '미래모빌리티학과',
  LIBERAL_ARTS: '교양대학',
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
  const { data: likedClubs, isLoading } = useLikedClubs();

  const list = likedClubs || [];

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
            <p>좋아요한 동아리가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((club) => (
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
                    <span className="mypage-club-tag-type rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      {TYPE_LABEL[club.type]}
                    </span>
                    {club.college && COLLEGE_LABEL[club.college] != null && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        {COLLEGE_LABEL[club.college]}
                      </span>
                    )}
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
        <div className="space-y-3 px-4 py-4">
          {[1, 2, 3].map((i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <LikedClubsListContent />
    </Suspense>
  );
}
