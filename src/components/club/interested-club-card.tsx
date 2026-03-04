'use client';

import Image from 'next/image';
import Link from 'next/link';

import type {
  ClubCategory,
  ClubInInterestListDto,
  ClubType,
  College,
  RecruitmentStatus,
} from '@/types/api';
import { useClubDetail } from '@/features/club/hooks';
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

type InterestedClubCardProps = {
  subscription: ClubInInterestListDto;
  className?: string;
};

/**
 * 관심동아리 카드. 관심 목록 API에는 동아리종류만 있으므로
 * 동아리 상세 API로 모집상태·학과·분야를 조회해 태그를 모두 표시.
 */
export function InterestedClubCard({ subscription, className = '' }: InterestedClubCardProps) {
  const { data: detail, isLoading } = useClubDetail(subscription.clubId);

  const name = detail?.name ?? subscription.clubName;
  const imageUrl = (detail?.image ?? subscription.clubProfileImageUrl) || '';
  const type = detail?.type ?? subscription.clubType;
  const recruitmentStatus = detail?.recruitmentStatus;
  const college = detail?.college;
  const category = detail?.category;

  return (
    <Link
      href={`/clubs/${subscription.clubId}`}
      className={`flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-4 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700 ${className}`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="56px" />
        ) : (
          <DefaultClubImage className="object-cover" sizes="56px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {recruitmentStatus && (
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CONFIG[recruitmentStatus].className}`}
            >
              {STATUS_CONFIG[recruitmentStatus].label}
            </span>
          )}
          <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            {TYPE_LABEL[type]}
          </span>
          {college && COLLEGE_LABEL[college] != null && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {COLLEGE_LABEL[college]}
            </span>
          )}
          {category && (
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {CATEGORY_LABEL[category]}
            </span>
          )}
          {isLoading && !detail && (
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
              …
            </span>
          )}
        </div>
        <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">{name}</h4>
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
