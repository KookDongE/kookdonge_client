'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Spinner, Tabs, TextArea } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubType, RecruitmentStatus } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { useClubDetail, useLikeClub, useUnlikeClub } from '@/features/club/hooks';
import { useInterestedStore } from '@/features/club/interested-store';
import { useClubFeeds } from '@/features/feed/hooks';
import { useCreateQuestion, useDeleteQuestion, useQuestions } from '@/features/question/hooks';
import {
  useAddToWaitingList,
  useMyWaitingList,
  useRemoveFromWaitingList,
} from '@/features/waiting-list/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

function ClubHeader({ clubId }: { clubId: number }) {
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
    } else {
      likeClub.mutate(clubId);
    }
  };

  const handleInterestedToggle = () => {
    if (isInterestedByMe) {
      remove(clubId);
    } else {
      add({
        id: club.id,
        name: club.name,
        logoImage: club.image ?? '',
        type: club.type,
      });
    }
  };

  const handleNotificationToggle = () => {
    if (addNotification.isPending || removeNotification.isPending) return;
    if (isNotificationOn) {
      removeNotification.mutate(clubId);
    } else {
      addNotification.mutate(clubId);
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
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{club.name}</h1>
          {club.summary && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{club.summary}</p>
          )}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={isLiking}
          className={`flex-1 rounded-xl py-3 text-center transition-colors ${
            club.isLikedByMe ? 'bg-red-200 dark:bg-red-900/50' : 'bg-red-50 dark:bg-red-950/30'
          }`}
        >
          <div
            className={`text-xl font-bold ${club.isLikedByMe ? 'text-red-600 dark:text-red-300' : 'text-red-500 dark:text-red-400'}`}
          >
            {club.totalLikeCount}
          </div>
          <div
            className={`text-xs ${club.isLikedByMe ? 'text-red-600/80 dark:text-red-300/80' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            좋아요
          </div>
        </button>
        <button
          type="button"
          onClick={handleInterestedToggle}
          className={`flex-1 rounded-xl py-3 text-center transition-colors ${
            isInterestedByMe
              ? 'bg-amber-200 dark:bg-amber-900/50'
              : 'bg-amber-50 dark:bg-amber-950/30'
          }`}
          title="관심 동아리"
        >
          <div
            className={`text-xl font-bold ${isInterestedByMe ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600 dark:text-amber-400'}`}
          >
            {isInterestedByMe ? '★' : '☆'}
          </div>
          <div
            className={`text-xs ${isInterestedByMe ? 'text-amber-700/80 dark:text-amber-300/80' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            관심
          </div>
        </button>
        <button
          type="button"
          onClick={handleNotificationToggle}
          disabled={addNotification.isPending || removeNotification.isPending}
          className={`flex-1 rounded-xl py-3 text-center transition-colors ${
            isNotificationOn ? 'bg-sky-200 dark:bg-sky-900/50' : 'bg-sky-50 dark:bg-sky-950/30'
          }`}
          title={isNotificationOn ? '모집 알림 해제' : '모집 알림 받기'}
        >
          <div
            className={`relative flex justify-center ${isNotificationOn ? 'text-sky-700 dark:text-sky-300' : 'text-sky-600 dark:text-sky-400'}`}
          >
            <BellIcon className="h-7 w-7" />
            {!isNotificationOn && (
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <span className="h-0.5 w-1/3 rotate-45 rounded-full bg-current opacity-70" />
              </span>
            )}
          </div>
          <div
            className={`mt-0.5 text-xs ${isNotificationOn ? 'text-sky-700/80 dark:text-sky-300/80' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            알림
          </div>
        </button>
        <div className="flex-1 rounded-xl bg-blue-50 py-3 text-center dark:bg-blue-950/30">
          <div className="text-xl font-bold text-blue-500 dark:text-blue-400">
            {club.totalViewCount}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">조회수</div>
        </div>
      </div>
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
      label: '주간 활동',
      value:
        club.weeklyActivity ??
        (club.weeklyActiveFrequency != null ? `${club.weeklyActiveFrequency}회` : '-'),
    },
    { label: '휴학생 지원 가능', value: club.allowLeaveOfAbsence ? '가능' : '불가능' },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">동아리 소개</h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
          {club.content}
        </p>
        {club.descriptionImages && club.descriptionImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {club.descriptionImages.map((url) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
              >
                <Image src={url} alt="" fill className="object-cover" sizes="120px" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">기본 정보</h3>
        <div className="space-y-3">
          {infoItems.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">{item.label}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.value}</span>
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
}: {
  clubId: number;
  highlightQuestionId?: string | null;
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
    console.log('질문 등록 요청:', requestData);
    console.log('profile:', profile);
    createQuestion.mutate(requestData, {
      onSuccess: () => {
        setQuestionText('');
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

  return (
    <>
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
      <ClubHeader clubId={clubId} />
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as string)} className="w-full">
        <Tabs.ListContainer className="bg-white px-4 dark:bg-zinc-900">
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
        <Tabs.Panel id="info">
          <ClubInfoTab clubId={clubId} />
        </Tabs.Panel>
        <Tabs.Panel id="feed">
          <ClubFeedTab clubId={clubId} />
        </Tabs.Panel>
        <Tabs.Panel id="qna">
          <ClubQnaTab clubId={clubId} highlightQuestionId={questionId} />
        </Tabs.Panel>
      </Tabs>
      {/* 하단 네비 + CTA 공간 확보 */}
      <div className="h-32" />
      <ClubCTA clubId={clubId} />
    </>
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
