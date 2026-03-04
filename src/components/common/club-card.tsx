'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { motion } from 'framer-motion';

import { ClubCategory, ClubListRes, ClubType, RecruitmentStatus, type College } from '@/types/api';
import { DefaultClubImage } from '@/components/common/default-club-image';

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

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학회',
  CLUB: '소모임',
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

type ClubCardProps = {
  club: ClubListRes;
  index?: number;
  /** 홈 필터 유지용: 뒤로가기 시 이동할 URL (예: /home?category=ACADEMIC) */
  returnTo?: string;
  disableLink?: boolean;
  drag?: 'x' | 'y' | boolean;
  dragConstraints?: { left?: number; right?: number; top?: number; bottom?: number };
  dragElastic?: number;
  onDragStart?: () => void;
  onDrag?: (event: unknown, info: { offset: { x: number } }) => void;
  onDragEnd?: (event: unknown, info: { offset: { x: number } }) => void;
  style?: React.CSSProperties & { x?: number };
  animate?: object;
  transition?: { type?: string; duration?: number };
};

export function ClubCard({
  club,
  index = 0,
  returnTo,
  disableLink = false,
  drag,
  dragConstraints,
  dragElastic,
  onDragStart,
  onDrag,
  onDragEnd,
  style,
  animate,
  transition,
}: ClubCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const status = STATUS_CONFIG[club.recruitmentStatus];

  const cardContent = (
    <motion.div
      whileTap={disableLink ? undefined : { scale: 0.98 }}
      className={`flex min-h-24 overflow-hidden rounded-2xl border border-zinc-100 bg-[var(--card)] dark:border-zinc-800 ${!disableLink ? 'card-hover' : ''}`}
    >
      {/* Image Section - 한줄소개 밑 여백이 태그 상단 여백과 맞도록 높이 축소 */}
      <div className="club-logo-wrap relative h-24 min-h-24 w-24 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {club.logoImage ? (
          <>
            {!imageLoaded && <div className="skeleton absolute inset-0" />}
            <Image
              src={club.logoImage}
              alt={club.name}
              fill
              className={`object-cover transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="96px"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <DefaultClubImage className="object-cover" sizes="96px" />
        )}
      </div>

      {/* Content Section - 태그/제목은 항상 동일 위치(한줄소개 유무와 무관) */}
      <div className="flex min-w-0 flex-1 flex-col justify-start p-3">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}
          >
            {status.label}
          </span>
          <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            {TYPE_LABEL[club.type]}
          </span>
          {club.college && COLLEGE_LABEL[club.college] != null && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {COLLEGE_LABEL[club.college]}
            </span>
          )}
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {CATEGORY_LABEL[club.category]}
          </span>
        </div>

        <h3 className="mb-1 line-clamp-2 text-base font-bold break-words text-zinc-900 dark:text-zinc-100">
          {club.name}
        </h3>

        <p className="line-clamp-1 min-h-[1.5rem] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {club.introduction || '\u00A0'}
        </p>
      </div>
    </motion.div>
  );

  // style에 x가 있으면 드래그 모드 (스와이프 기능)
  const isDragMode = drag && style && 'x' in style;

  const motionProps: Record<string, unknown> = {
    initial: isDragMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    animate: isDragMode
      ? { opacity: 1, y: 0, ...(animate && typeof animate === 'object' ? animate : {}) }
      : animate || { opacity: 1, y: 0 },
    transition:
      isDragMode && transition
        ? {
            delay: 0,
            duration: transition.duration ?? 0.2,
            type: (transition.type as string) ?? 'tween',
          }
        : { delay: index * 0.05, duration: 0.3 },
  };

  if (drag) {
    motionProps.drag = drag;
    if (dragConstraints) motionProps.dragConstraints = dragConstraints;
    if (dragElastic !== undefined) motionProps.dragElastic = dragElastic;
    if (onDragStart) motionProps.onDragStart = onDragStart;
    if (onDrag) motionProps.onDrag = onDrag;
    if (onDragEnd) motionProps.onDragEnd = onDragEnd;
    if (style) {
      motionProps.style = style;
    }
  }

  return (
    <motion.div {...motionProps}>
      {disableLink ? (
        <div className="block">{cardContent}</div>
      ) : (
        <Link
          href={
            returnTo != null && returnTo !== ''
              ? `/clubs/${club.id}?from=${encodeURIComponent(returnTo)}`
              : `/clubs/${club.id}`
          }
          className="block"
        >
          {cardContent}
        </Link>
      )}
    </motion.div>
  );
}

// Skeleton Component for loading state
export function ClubCardSkeleton() {
  return (
    <div className="flex h-24 overflow-hidden rounded-2xl border border-zinc-100 bg-[var(--card)] dark:border-zinc-800">
      <div className="skeleton h-24 w-24 shrink-0" />
      <div className="flex flex-1 flex-col justify-center p-3">
        <div className="mb-1.5 flex gap-1.5">
          <div className="skeleton h-5 w-12 rounded-full" />
          <div className="skeleton h-5 w-10 rounded-md" />
          <div className="skeleton h-5 w-14 rounded-md" />
        </div>
        <div className="skeleton mb-1 h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
      </div>
    </div>
  );
}
