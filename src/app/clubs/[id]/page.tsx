'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Spinner, Tabs, TextArea } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubType, RecruitmentStatus } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { useClubDetail, useLikeClub, useUnlikeClub } from '@/features/club/hooks';
import { useInterestedStore } from '@/features/club/interested-store';
import { useNotification } from '@/features/device/use-notification';
import { useClubFeeds } from '@/features/feed/hooks';
import { useCreateQuestion, useDeleteQuestion, useQuestions } from '@/features/question/hooks';
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
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
  const interestedClubs = useInterestedStore((s) => s.clubs);
  const add = useInterestedStore((s) => s.add);
  const remove = useInterestedStore((s) => s.remove);
  const { data: subscriptions } = useMyWaitingList();
  const addNotification = useAddToWaitingList();
  const removeNotification = useRemoveFromWaitingList();

  const isInterestedByMe = interestedClubs.some((c) => c.id === clubId);
  const isNotificationOn = (subscriptions ?? []).some((s) => s.clubId === clubId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  const showActionMessage = (message: string) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setActionMessage(message);
    messageTimeoutRef.current = setTimeout(() => {
      setActionMessage(null);
      messageTimeoutRef.current = null;
    }, 2500);
  };

  if (isLoading || !club) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const status = STATUS_CONFIG[club.recruitmentStatus];
  const isLiking = likeClub.isPending || unlikeClub.isPending;

  const handleLikeToggle = () => {
    if (isLiking) return;
    if (club.isLikedByMe) {
      unlikeClub.mutate(clubId);
      showActionMessage('좋아요를 취소했습니다.');
    } else {
      likeClub.mutate(clubId);
      showActionMessage('좋아요를 눌렀습니다.');
    }
  };

  const handleInterestedToggle = () => {
    if (isInterestedByMe) {
      remove(clubId);
      showActionMessage('관심 해제를 눌렀습니다.');
    } else {
      add({
        id: club.id,
        name: club.name,
        logoImage: club.image ?? '',
        type: club.type,
        category: club.category,
        recruitmentStatus: club.recruitmentStatus,
      });
      showActionMessage('관심 동아리를 눌렀습니다.');
    }
  };

  const handleNotificationToggle = () => {
    if (addNotification.isPending || removeNotification.isPending) return;
    if (isNotificationOn) {
      removeNotification.mutate(clubId);
      showActionMessage('알림을 해제했습니다.');
    } else {
      addNotification.mutate(clubId);
      onNotificationTurnOnRequest?.(clubId);
      showActionMessage('알림을 켰습니다. 동아리 모집 시작 및 마감 전 알림을 받을 수 있습니다.');
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
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {CATEGORY_LABEL[club.category]}
            </span>
          </div>
          {/* 동아리 이름: 태그 바로 아래 */}
          <h1 className="mt-1.5 text-xl font-bold text-zinc-900 dark:text-zinc-100">{club.name}</h1>
          {club.summary && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{club.summary}</p>
          )}
          {/* 관심, 알림, 좋아요(숫자), 조회수(숫자): 사진 하단 우측 1열 */}
          <div className="mt-auto flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleInterestedToggle}
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
      {actionMessage && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)] z-50 flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="max-w-[calc(100%-2rem)] rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-zinc-900 shadow-lg dark:bg-white dark:text-zinc-900"
          >
            {actionMessage}
          </div>
        </div>
      )}
    </div>
  );
}

function ClubInfoTab({ clubId }: { clubId: number }) {
  const { data: club } = useClubDetail(clubId);

  if (!club) return null;

  const infoItems = [
    {
      label: '모집 기간',
      value: `${formatDate(club.recruitmentStartDate)} ~ ${formatDate(club.recruitmentEndDate)}`,
    },
    { label: '대상', value: club.targetGraduate },
    { label: '동아리장', value: club.leaderName },
    { label: '활동 장소', value: club.location },
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
            <div className="relative mx-4 mb-4 aspect-square max-w-[calc(100%-2rem)] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={contentImageUrl}
                alt="동아리 소개"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
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
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0 text-sm"
            >
              <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{item.label}</span>
              <span className="min-w-0 truncate text-right font-medium text-zinc-900 dark:text-zinc-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClubFeedTab({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data, isLoading } = useClubFeeds(clubId);
  const feeds = data?.clubFeedList || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
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
            className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800"
          >
            {cover ? (
              <Image src={cover} alt="" fill className="object-cover" sizes="120px" />
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
  highlightQuestionId,
  onQuestionSubmitted,
}: {
  clubId: number;
  highlightQuestionId?: string | null;
  onQuestionSubmitted?: () => void;
}) {
  const { data, isLoading } = useQuestions(clubId, { page: 0, size: 20 });
  const { data: profile } = useMyProfile();
  const createQuestion = useCreateQuestion(clubId);
  const deleteQuestion = useDeleteQuestion(clubId);
  const [questionText, setQuestionText] = useState('');

  const questions = data?.content || [];

  useEffect(() => {
    if (!highlightQuestionId || questions.length === 0) return;
    const el = document.getElementById(`question-${highlightQuestionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightQuestionId, questions.length]);

  const handleSubmit = () => {
    if (!questionText.trim() || !profile) return;
    const requestData = { question: questionText.trim(), userName: profile.email };
    createQuestion.mutate(requestData, {
      onSuccess: () => {
        setQuestionText('');
        onQuestionSubmitted?.();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">질문하기</h4>
        <div className="bg-default-100 relative rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800/50">
          <TextArea
            placeholder="궁금한 점을 질문해주세요"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[2.5rem] w-full resize-none border-0 bg-transparent py-2 pr-14 pl-3 shadow-none placeholder:text-zinc-400 hover:shadow-none focus:ring-0 dark:placeholder:text-zinc-500"
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
                  {new Date(qna.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('이 질문을 삭제할까요?')) {
                    deleteQuestion.mutate(qna.id);
                  }
                }}
                disabled={deleteQuestion.isPending}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                aria-label="질문 삭제"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            {qna.answer && (
              <div className="mt-3 flex items-start gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
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
    </div>
  );
}

function ClubCTA({ clubId }: { clubId: number }) {
  const { data: club } = useClubDetail(clubId);

  const applicationLink = club?.applicationLink || club?.recruitmentUrl;
  if (!club || !applicationLink) return null;

  const ctaBottom = 'calc(72px + env(safe-area-inset-bottom))';
  const handleApplyClick = () => {
    window.open(applicationLink, '_blank');
  };

  return (
    <div
      className="glass fixed left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl border-t-0 p-4"
      style={{ bottom: ctaBottom }}
    >
      <Button
        className="w-full py-3 text-base font-semibold"
        variant="primary"
        onPress={handleApplyClick}
      >
        동아리 지원
      </Button>
    </div>
  );
}

function ClubDetailContent({ clubId }: { clubId: number }) {
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId');
  const from = searchParams.get('from');
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('info'));
  const router = useRouter();
  const {
    permission,
    requestPermissionAndRegister,
    isLoading: isPermissionLoading,
  } = useNotification();
  const [notificationPromptOpen, setNotificationPromptOpen] = useState(false);

  useEffect(() => {
    if (questionId) setTab('qna');
  }, [questionId, setTab]);

  const handleBack = () => {
    if (from) {
      router.push(from);
    } else {
      router.back();
    }
  };

  const tryShowNotificationPrompt = () => {
    if (permission !== 'granted' && !getNotificationInlinePromptSeen()) {
      setNotificationPromptOpen(true);
    }
  };

  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </button>
      </div>
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
        <Tabs.Panel id="info" className="min-w-0 overflow-hidden">
          <ClubInfoTab clubId={clubId} />
        </Tabs.Panel>
        <Tabs.Panel id="feed">
          <ClubFeedTab clubId={clubId} />
        </Tabs.Panel>
        <Tabs.Panel id="qna">
          <ClubQnaTab
            clubId={clubId}
            highlightQuestionId={questionId}
            onQuestionSubmitted={tryShowNotificationPrompt}
          />
        </Tabs.Panel>
      </Tabs>
      {/* 하단 네비 + CTA 공간 확보 */}
      <div className="h-32" />
      <ClubCTA clubId={clubId} />
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
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <ClubDetailContent clubId={clubId} />
    </Suspense>
  );
}
