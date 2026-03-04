'use client';

import { Suspense, use, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Tabs, TextArea } from '@heroui/react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { parseAsString, useQueryState } from 'nuqs';
import { createPortal } from 'react-dom';

import { ClubCategory, ClubType, College, RecruitmentStatus } from '@/types/api';
import { formatQnaDateTime, parseApiIsoToDate } from '@/lib/utils';
import { useMyProfile } from '@/features/auth/hooks';
import { useClubDetail, useLikeClub, useUnlikeClub } from '@/features/club/hooks';
import { useNotification } from '@/features/device/use-notification';
import { useClubFeeds } from '@/features/feed/hooks';
import { useAddInterest, useMyInterests, useRemoveInterest } from '@/features/interest/hooks';
import { useCreateQuestion, useQuestions } from '@/features/question/hooks';
import {
  useAddToWaitingList,
  useMyWaitingList,
  useRemoveFromWaitingList,
} from '@/features/waiting-list/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';
import {
  getNotificationInlinePromptSeen,
  NotificationPermissionInlineModal,
} from '@/components/common/notification-permission-inline-modal';
import { ClubDetailHeaderSkeleton, FeedItemSkeleton } from '@/components/common/skeletons';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { BellIcon } from '@/components/icons/notification-icon';

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

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 모집기간 등 날짜+시간 표시 (한국 시간) */
function formatDateTime(dateString: string | null | undefined): string {
  const date = parseApiIsoToDate(dateString);
  if (!date) return '-';
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export type ExternalLinkItem = { name: string; url: string };

function parseExternalLinks(externalLink: string | undefined): ExternalLinkItem[] {
  if (!externalLink || typeof externalLink !== 'string') return [];
  const trimmed = externalLink.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is ExternalLinkItem =>
            item != null &&
            typeof item === 'object' &&
            typeof (item as ExternalLinkItem).url === 'string' &&
            (item as ExternalLinkItem).url.trim() !== ''
        )
        .map((item) => ({
          name:
            typeof (item as ExternalLinkItem).name === 'string'
              ? (item as ExternalLinkItem).name
              : '',
          url: (item as ExternalLinkItem).url.trim(),
        }));
    }
  } catch {
    // single URL
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return [{ name: '', url: trimmed }];
  }
  return [];
}

function getFaviconUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
  } catch {
    return '';
  }
}

function getDisplayName(item: ExternalLinkItem): string {
  if (item.name.trim()) return item.name.trim();
  try {
    return new URL(item.url).hostname.replace(/^www\./, '');
  } catch {
    return item.url;
  }
}

function ClubHeader({
  clubId,
  onNotificationTurnOnRequest,
}: {
  clubId: number;
  onNotificationTurnOnRequest?: (clubId: number) => void;
}) {
  const { data: club, isLoading } = useClubDetail(clubId);
  const likeClub = useLikeClub();
  const unlikeClub = useUnlikeClub();
  const { data: interests } = useMyInterests();
  const addInterest = useAddInterest();
  const removeInterest = useRemoveInterest();
  const { data: subscriptions } = useMyWaitingList();
  const addNotification = useAddToWaitingList();
  const removeNotification = useRemoveFromWaitingList();

  const isInterestedByMe = (interests ?? []).some((s) => s.clubId === clubId);
  const isNotificationOn = (subscriptions ?? []).some((s) => s.clubId === clubId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearActionMessage = useCallback(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setActionMessage(null);
  }, []);

  const showActionMessage = useCallback(
    (message: string) => {
      clearActionMessage();
      setActionMessage(message);
      messageTimeoutRef.current = setTimeout(clearActionMessage, 2500);
    },
    [clearActionMessage]
  );

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  // 스크롤·다른 행동 시 스낵바 즉시 닫기
  useEffect(() => {
    if (!actionMessage) return;
    const scrollEl = document.querySelector('[data-scroll-container]');
    const onScroll = () => clearActionMessage();
    scrollEl?.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl?.removeEventListener('scroll', onScroll);
  }, [actionMessage, clearActionMessage]);

  if (isLoading || !club) {
    return <ClubDetailHeaderSkeleton />;
  }

  const status = STATUS_CONFIG[club.recruitmentStatus];
  const isLiking = likeClub.isPending || unlikeClub.isPending;

  const handleLikeToggle = () => {
    if (isLiking) return;
    clearActionMessage();
    if (club.isLikedByMe) {
      unlikeClub.mutate(clubId);
    } else {
      likeClub.mutate(clubId);
    }
  };

  const handleInterestedToggle = () => {
    if (addInterest.isPending || removeInterest.isPending) return;
    clearActionMessage();
    if (isInterestedByMe) {
      removeInterest.mutate(clubId);
      showActionMessage('관심 목록에서 해제했어요.');
    } else {
      addInterest.mutate(clubId);
      showActionMessage('관심 목록에 추가했어요.');
    }
  };

  const handleNotificationToggle = () => {
    if (addNotification.isPending || removeNotification.isPending) return;
    clearActionMessage();
    if (isNotificationOn) {
      removeNotification.mutate(clubId);
      showActionMessage('알림을 해제했어요.');
    } else {
      addNotification.mutate(clubId);
      onNotificationTurnOnRequest?.(clubId);
      showActionMessage('이제 모집 시작 알림, 모집 마감 하루 전 알림을 받을 수 있어요!');
    }
  };

  return (
    <div className="bg-white px-4 py-6 dark:bg-zinc-900">
      <div className="flex gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm dark:bg-zinc-800">
          {club.image ? (
            <Image src={club.image} alt={club.name} fill className="object-cover" sizes="112px" />
          ) : (
            <DefaultClubImage className="object-cover" sizes="112px" />
          )}
        </div>
        <div className="flex min-h-28 flex-1 flex-col">
          {/* 태그: 사진 상단과 맞춤 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}
            >
              {status.label}
            </span>
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {TYPE_LABEL[club.type]}
            </span>
            {club.type === 'DEPARTMENTAL' && club.college && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {COLLEGE_LABEL[club.college]}
              </span>
            )}
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {CATEGORY_LABEL[club.category]}
            </span>
          </div>
          {/* 동아리 이름: 태그 바로 아래 */}
          <h1 className="mt-1.5 text-xl font-bold text-zinc-900 dark:text-zinc-100">{club.name}</h1>
          <p className="mt-1 line-clamp-1 min-h-[1.5rem] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {club.description ?? club.summary ?? '\u00A0'}
          </p>
          {/* 관심, 알림, 좋아요(숫자), 조회수(숫자): 사진 하단 우측 1열 */}
          <div className="mt-auto flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleInterestedToggle}
              disabled={addInterest.isPending || removeInterest.isPending}
              className={`rounded-lg p-1.5 transition-colors active:scale-95 ${
                isInterestedByMe
                  ? 'bg-amber-100 dark:bg-amber-500/20'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="관심 동아리"
              aria-label={isInterestedByMe ? '관심 해제' : '관심 등록'}
            >
              <StarIcon
                filled={isInterestedByMe}
                className={`h-4 w-4 shrink-0 ${isInterestedByMe ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              />
            </button>
            <button
              type="button"
              onClick={handleNotificationToggle}
              disabled={addNotification.isPending || removeNotification.isPending}
              className={`rounded-lg p-1.5 transition-colors active:scale-95 ${
                isNotificationOn
                  ? 'bg-sky-100 dark:bg-sky-500/20'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={isNotificationOn ? '모집 알림 해제' : '모집 알림 받기'}
              aria-label={isNotificationOn ? '알림 해제' : '알림 받기'}
            >
              <div
                className={`flex items-center justify-center ${isNotificationOn ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              >
                <BellIcon className="h-4 w-4 shrink-0" />
              </div>
            </button>
            <button
              type="button"
              onClick={handleLikeToggle}
              disabled={isLiking}
              className={`flex items-center gap-1 rounded-lg px-1.5 py-1 transition-colors active:scale-95 ${
                club.isLikedByMe
                  ? 'bg-red-100 dark:bg-red-500/20'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              aria-label={
                club.isLikedByMe
                  ? `좋아요 취소 (${club.totalLikeCount})`
                  : `좋아요 (${club.totalLikeCount})`
              }
            >
              <HeartIcon
                filled={club.isLikedByMe}
                className={`h-4 w-4 shrink-0 ${club.isLikedByMe ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              />
              <span className="text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
                {club.totalLikeCount}
              </span>
            </button>
            <div
              className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-zinc-500 dark:text-zinc-400"
              aria-label={`조회수 ${club.totalViewCount}`}
            >
              <EyeIcon className="h-4 w-4 shrink-0" />
              <span className="text-xs tabular-nums">{club.totalViewCount}</span>
            </div>
          </div>
        </div>
      </div>
      {actionMessage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed right-0 bottom-20 left-0 z-[100] px-4" aria-hidden="true">
            <div
              role="status"
              aria-live="polite"
              className="mx-auto max-w-2xl rounded-lg bg-zinc-600/95 px-4 py-2.5 text-center text-sm text-white dark:bg-zinc-700/95 dark:text-zinc-100"
            >
              {actionMessage}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function ClubInfoTab({ clubId }: { clubId: number }) {
  const { data: club } = useClubDetail(clubId);

  if (!club) return null;

  const infoItems = [
    { label: '모집 시작', value: formatDateTime(club.recruitmentStartDate) },
    { label: '모집 마감', value: formatDateTime(club.recruitmentEndDate) },
    { label: '대상', value: club.targetGraduate },
    { label: '동아리장', value: club.leaderName },
    ...(club.location?.trim()
      ? [{ label: '활동 장소' as const, value: club.location }]
      : []),
    {
      label: '주간활동 횟수',
      value:
        club.weeklyActivity ??
        (club.weeklyActiveFrequency != null ? `${club.weeklyActiveFrequency}회` : '-'),
    },
    { label: '휴학생 지원 가능', value: club.allowLeaveOfAbsence ? '가능' : '불가능' },
  ];

  const contentImageUrl = club.contentImageUrl ?? club.descriptionImages?.[0];
  const hasIntroduction = (club.content != null && club.content.trim() !== '') || !!contentImageUrl;

  return (
    <div className="min-w-0 space-y-4 p-4">
      {hasIntroduction && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-3 px-4 pt-4 font-semibold text-zinc-900 dark:text-zinc-100">
            동아리 소개
          </h3>
          {contentImageUrl && (
            <div className="relative mx-4 mb-4 w-[calc(100%-2rem)] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {/* 원본 비율 유지 위해 img 사용 (Next/Image는 fill 시 비율 고정 어려움) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contentImageUrl}
                alt="동아리 소개"
                className="h-auto w-full rounded-lg object-contain"
              />
            </div>
          )}
          {club.content != null && club.content.trim() !== '' && (
            <div className="p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {club.content}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">기본 정보</h3>
        <div className="min-w-0 space-y-3">
          {infoItems.map((item) => {
            const isRecruitmentDate = item.label === '모집 시작' || item.label === '모집 마감';
            return (
              <div
                key={item.label}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-0 text-sm"
              >
                <span className="shrink-0 pt-0.5 text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </span>
                <span
                  className={`min-w-0 text-right font-medium text-zinc-900 dark:text-zinc-100 ${
                    isRecruitmentDate ? 'break-words' : 'truncate'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {(() => {
        const links = parseExternalLinks(club.externalLink);
        if (links.length === 0) return null;
        return (
          <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">외부 링크</h3>
            <ul className="space-y-2">
              {links.map((item, i) => (
                <li key={`${item.url}-${i}`}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg py-1.5 pr-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                  >
                    {getFaviconUrl(item.url) ? (
                      <Image
                        src={getFaviconUrl(item.url)}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0 rounded object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded bg-zinc-200 dark:bg-zinc-600" />
                    )}
                    <span className="min-w-0 truncate text-sm font-normal text-zinc-600 dark:text-zinc-400">
                      {getDisplayName(item)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}

function ClubFeedTab({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data, isLoading } = useClubFeeds(clubId);
  const feeds = data?.clubFeedList || [];

  if (isLoading) {
    return (
      <div className="space-y-6 px-2">
        {[1, 2].map((i) => (
          <FeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
        <p>아직 피드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1.5">
      {feeds.map((feed) => {
        const cover = feed.postUrls?.[0];
        return (
          <button
            key={feed.feedId}
            type="button"
            onClick={() => router.push(`/clubs/${clubId}/feed`)}
            className="relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-700"
          >
            {cover ? (
              <FeedCoverImage src={cover} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                텍스트
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ClubQnaTab({
  clubId,
  onQuestionSubmitted,
}: {
  clubId: number;
  onQuestionSubmitted?: () => void;
}) {
  const { data, isLoading } = useQuestions(clubId, { page: 0, size: 20 });
  const { data: profile } = useMyProfile();
  const createQuestion = useCreateQuestion(clubId);
  const [questionText, setQuestionText] = useState('');
  const questions = data?.content ?? [];

  const handleSubmit = () => {
    if (!questionText.trim() || !profile) return;
    createQuestion.mutate(
      { question: questionText.trim() },
      {
        onSuccess: () => {
          setQuestionText('');
          onQuestionSubmitted?.();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">질문하기</h4>
        <div className="bg-default-100 relative flex min-h-0 w-full rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800/50">
          <TextArea
            placeholder="궁금한 점을 질문해주세요"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[2.5rem] w-full min-w-0 resize-none border-0 bg-transparent py-2 pr-14 pl-3 shadow-none placeholder:text-zinc-400 hover:shadow-none focus:ring-0 dark:placeholder:text-zinc-500"
          />
          <Button
            size="sm"
            variant="primary"
            onPress={handleSubmit}
            isDisabled={!questionText.trim() || !profile || createQuestion.isPending}
            isPending={createQuestion.isPending}
            className="absolute top-1/2 right-1.5 shrink-0 -translate-y-1/2"
          >
            등록
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
          <p>아직 질문이 없습니다.</p>
        </div>
      ) : (
        questions.map((qna) => (
          <div
            key={qna.id}
            id={`question-${qna.id}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                aria-hidden
              >
                Q
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {qna.question}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatQnaDateTime(qna.createdAt)}
                </p>
              </div>
            </div>
            {qna.answer && (
              <div className="mt-3 flex items-start gap-3 pt-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                  aria-hidden
                >
                  A
                </span>
                <p className="flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {qna.answer}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}

/** 정보 탭에서만 노출. fixed 우측 하단 + 스크롤 시 스프링 애니메이션. 앱 뷰(max-w-md) 열 안에만 오도록 포탈 래퍼 사용 */
function ClubCTABottom({ clubId, currentTab }: { clubId: number; currentTab: string }) {
  const { data: club } = useClubDetail(clubId);
  const applicationLink = club?.applicationLink || club?.recruitmentUrl;
  const shouldShow = !!club && !!applicationLink && currentTab === 'info';

  // 스크롤 시에만 움직이고, 항상 기본 위치(최저·최대 높이의 중간)로 복귀하려는 스프링
  const scrollY = useMotionValue(0);
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 45,
    damping: 22,
    mass: 1,
  });
  const FOLLOW_MAX_PX = 20;
  const FOLLOW_MIN_HEIGHT_PX = 12; // 최저 높이를 조금 더 높게 (스크롤 시 버튼이 내려가는 한계를 줄임)
  const targetOffsetY = useTransform(smoothScrollY, (value) =>
    Math.min(value * 0.08, FOLLOW_MAX_PX - FOLLOW_MIN_HEIGHT_PX)
  );
  // 목표 오프셋을 한 번 더 스프링으로 따라가서 “기본 위치로 돌아가려는” 느낌
  const displayY = useSpring(targetOffsetY, {
    stiffness: 180,
    damping: 26,
    mass: 0.6,
  });

  useEffect(() => {
    if (!shouldShow) return;
    const el = document.querySelector('[data-scroll-container]');
    if (!el) return;
    const onScroll = () => scrollY.set(el.scrollTop);
    onScroll(); // 초기값
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [shouldShow, scrollY]);

  if (!club || !applicationLink) return null;

  const handleApplyClick = () => {
    window.open(applicationLink, '_blank');
  };

  // 네비(4rem) + safe-area + 여유 공간 위에 배치해 네비와 겹치지 않게
  const bottomOffset = 'calc(8rem + env(safe-area-inset-bottom, 0px))';
  const buttonBottom = 'calc(4rem + 1.5rem + env(safe-area-inset-bottom, 0px))';

  // 앱 뷰 안에서만 보이도록 body 포탈 없이 인라인 렌더 (app-shell의 max-w-md overflow-hidden에 의해 웹에서 앱 열 밖은 잘림)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
      style={{ top: 'auto', height: bottomOffset }}
      aria-hidden
    >
      <div className="pointer-events-none relative mx-auto h-full w-full max-w-md">
        <motion.div
          className="pointer-events-auto absolute right-4"
          style={{
            bottom: buttonBottom,
            y: displayY,
          }}
        >
          <AnimatePresence mode="wait">
            {shouldShow && (
              <motion.div
                key="club-cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-full bg-white/95 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95"
              >
                <Button
                  size="sm"
                  className="min-w-0 rounded-full px-4 py-2 text-sm font-semibold"
                  variant="primary"
                  onPress={handleApplyClick}
                >
                  지원하기
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function ClubDetailContent({ clubId }: { clubId: number }) {
  const { data: club, isLoading: clubLoading, isError: clubError } = useClubDetail(clubId);
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId');
  const _from = searchParams.get('from');
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('info'));
  const router = useRouter();
  const {
    permission,
    requestPermissionAndRegister,
    isLoading: isPermissionLoading,
  } = useNotification();
  const [notificationPromptOpen, setNotificationPromptOpen] = useState(false);

  // 없는 동아리 또는 잘못된 id → 홈으로
  useEffect(() => {
    if (Number.isNaN(clubId) || clubId < 1) {
      router.replace('/home');
      return;
    }
    if (clubError || (!clubLoading && !club)) {
      router.replace('/home');
    }
  }, [clubId, clubError, clubLoading, club, router]);

  useEffect(() => {
    if (questionId) setTab('qna');
  }, [questionId, setTab]);

  const tryShowNotificationPrompt = () => {
    if (permission !== 'granted' && !getNotificationInlinePromptSeen()) {
      setNotificationPromptOpen(true);
    }
  };

  if (Number.isNaN(clubId) || clubId < 1 || clubError || (!clubLoading && !club)) {
    return <ClubDetailHeaderSkeleton />;
  }

  return (
    <div className="min-h-full min-w-0 overflow-x-hidden">
      <ClubHeader clubId={clubId} onNotificationTurnOnRequest={tryShowNotificationPrompt} />
      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => setTab(key as string)}
        className="w-full min-w-0"
      >
        <Tabs.ListContainer className="bg-[var(--card)] px-4">
          <Tabs.List aria-label="동아리 정보" className="flex w-full">
            <Tabs.Tab
              id="info"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              정보
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab
              id="feed"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              피드
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab
              id="qna"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Q&A
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="info" className="min-w-0 overflow-x-hidden">
          <ClubInfoTab clubId={clubId} />
        </Tabs.Panel>
        <Tabs.Panel id="feed">
          <ClubFeedTab clubId={clubId} />
        </Tabs.Panel>
        <Tabs.Panel id="qna" className="space-y-4 p-4">
          <ClubQnaTab clubId={clubId} onQuestionSubmitted={tryShowNotificationPrompt} />
        </Tabs.Panel>
      </Tabs>
      {/* 하단 네비 + CTA 공간 확보 (지원 버튼 있을 때) */}
      <div className="h-32" />
      <ClubCTABottom clubId={clubId} currentTab={tab} />
      <NotificationPermissionInlineModal
        open={notificationPromptOpen}
        onClose={() => setNotificationPromptOpen(false)}
        onAllow={requestPermissionAndRegister}
        isAllowLoading={isPermissionLoading}
      />
    </div>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ClubDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const clubId = parseInt(id, 10);

  return (
    <Suspense fallback={<ClubDetailHeaderSkeleton />}>
      <ClubDetailContent clubId={clubId} />
    </Suspense>
  );
}
