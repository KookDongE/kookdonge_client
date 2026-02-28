'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Chip, Spinner } from '@heroui/react';

import { ClubType } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { useLikedClubs, useManagedClubs, useMyApplications } from '@/features/club/hooks';
import { useInterestedStore } from '@/features/club/interested-store';
import { useMyQuestions, usePendingQuestions, useQuestions } from '@/features/question/hooks';
import { useMyWaitingList } from '@/features/waiting-list/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학술동아리',
  CLUB: '동아리',
};

/** 마이페이지 목록 미리보기 최대 개수 (이상은 전체보기에서만 표시) */
const PREVIEW_LIMIT = 4;

function ProfileSection() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {profile ? (
            <div className="space-y-1">
              <h2 className="truncate text-lg font-bold text-zinc-800 dark:text-zinc-100">
                {profile.name || profile.email}
              </h2>
              <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">{profile.email}</p>
              {[profile.department, profile.studentId, profile.phoneNumber].some(Boolean) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {profile.department && <span>{profile.department}</span>}
                  {profile.studentId && <span>학번 {profile.studentId}</span>}
                  {profile.phoneNumber && <span>{profile.phoneNumber}</span>}
                </div>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">게스트</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">로그인이 필요합니다</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/mypage/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            aria-label="설정"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function WaitingListSection() {
  const { data: waitingList, isLoading } = useMyWaitingList();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const clubs = waitingList || [];

  if (clubs.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">답변 대기 목록</h3>
        <Link
          href="/mypage/waiting"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      <div className="space-y-3">
        {clubs.slice(0, PREVIEW_LIMIT).map((club) => (
          <button
            type="button"
            key={club.clubId}
            onClick={() => router.push(`/clubs/${club.clubId}`)}
            className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
          >
            <div className="flex items-start gap-3">
              <Chip size="sm" color="accent" variant="primary" className="shrink-0">
                Q
              </Chip>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {club.clubName}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '-'}
                </p>
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
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminSection() {
  const { data: managedClubs, isLoading: clubsLoading } = useManagedClubs();

  // 관리 중인 동아리가 없으면 섹션을 표시하지 않음
  if (!managedClubs || managedClubs.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">관리 중인 동아리</h3>
        <Link
          href="/mypage/managed"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {clubsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : managedClubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>관리 중인 동아리가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {managedClubs.slice(0, PREVIEW_LIMIT).map((club) => (
            <Link
              key={club.id}
              href={`/mypage/clubs/${club.id}/manage`}
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
                <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                  {club.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
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
  );
}

function PendingQuestionsSection() {
  const { data: managedClubs } = useManagedClubs();
  const router = useRouter();

  const firstManagedClubId = managedClubs?.[0]?.id;
  const { data: pendingQuestions, isLoading } = usePendingQuestions(firstManagedClubId || 0, {
    page: 0,
    size: 5,
  });

  if (!firstManagedClubId || !pendingQuestions || pendingQuestions.content.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">질문 대기 목록</h3>
        <Link
          href="/mypage/questions"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          {pendingQuestions.content.slice(0, PREVIEW_LIMIT).map((qna) => (
            <button
              type="button"
              key={qna.id}
              onClick={() =>
                router.push(
                  `/mypage/clubs/${firstManagedClubId}/manage?tab=qna&questionId=${qna.id}`
                )
              }
              className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
            >
              <div className="flex items-start gap-3">
                <Chip size="sm" color="accent" variant="primary" className="shrink-0">
                  Q
                </Chip>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {qna.question}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(qna.createdAt).toLocaleDateString()}
                  </p>
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 질문 목록 (내가 쓴 질문 전체 - 모든 동아리). API 연동 전까지 빈 목록 표시. */
function QuestionsListSection() {
  const router = useRouter();
  const { data: questionsData, isLoading } = useMyQuestions({ page: 0, size: 5 });
  const list = questionsData?.content ?? [];
  // API 연동 시 응답에 clubId가 있으면 해당 동아리 Q&A로 이동
  const getItemHref = (qna: (typeof list)[0] & { clubId?: number }) =>
    qna.clubId
      ? `/mypage/clubs/${qna.clubId}/manage?tab=qna&questionId=${qna.id}`
      : '/mypage/questions';

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">질문 목록</h3>
        <Link
          href="/mypage/questions"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>등록된 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.slice(0, PREVIEW_LIMIT).map((qna) => (
            <button
              type="button"
              key={qna.id}
              onClick={() => router.push(getItemHref(qna))}
              className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
            >
              <div className="flex items-start gap-3">
                <Chip size="sm" color="accent" variant="soft" className="shrink-0">
                  Q
                </Chip>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {qna.question}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(qna.createdAt).toLocaleDateString()}
                    {qna.answer ? ' · 답변완료' : ' · 대기중'}
                  </p>
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 답변 목록 (답변 완료된 Q&A) */
function AnsweredListSection() {
  const { data: managedClubs } = useManagedClubs();
  const router = useRouter();
  const firstManagedClubId = managedClubs?.[0]?.id;
  const { data: questionsData, isLoading } = useQuestions(firstManagedClubId || 0, {
    page: 0,
    size: 20,
  });

  if (!firstManagedClubId) return null;

  const answered = (questionsData?.content ?? []).filter((q) => q.answer);

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">답변 목록</h3>
        <Link
          href="/mypage/questions"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : answered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>답변한 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {answered.slice(0, PREVIEW_LIMIT).map((qna) => (
            <button
              type="button"
              key={qna.id}
              onClick={() =>
                router.push(
                  `/mypage/clubs/${firstManagedClubId}/manage?tab=qna&questionId=${qna.id}`
                )
              }
              className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
            >
              <div className="flex items-start gap-3">
                <Chip size="sm" color="success" variant="soft" className="shrink-0">
                  A
                </Chip>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {qna.question}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {qna.answeredBy && `${qna.answeredBy} · `}
                    {new Date(qna.createdAt).toLocaleDateString()}
                  </p>
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LikedClubsSection() {
  const { data: likedClubs, isLoading } = useLikedClubs();

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">좋아요한 동아리</h3>
        <Link
          href="/mypage/liked"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !likedClubs || likedClubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>좋아요한 동아리가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {likedClubs.slice(0, PREVIEW_LIMIT).map((club) => (
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
                <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                  {club.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
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
  );
}

function InterestedClubsSection() {
  const interestedClubs = useInterestedStore((s) => s.getList());

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">관심 동아리</h3>
        <Link
          href="/mypage/interested"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {interestedClubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>관심 동아리가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interestedClubs.slice(0, PREVIEW_LIMIT).map((club) => (
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
                <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                  {club.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
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
  );
}

function ClubApplyButton() {
  const router = useRouter();

  return (
    <div className="px-4 py-2">
      <button
        type="button"
        onClick={() => router.push('/mypage/clubs/apply')}
        className="flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-left transition-colors hover:bg-blue-100/80 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          동아리 및 소모임 신청
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="ml-auto h-5 w-5 text-blue-500 dark:text-blue-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function MyApplicationsSection() {
  const { data: applications, isLoading } = useMyApplications();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const list = applications || [];

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">내 신청 목록</h3>
        <Link
          href="/mypage/applications"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          전체보기
        </Link>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>신청한 동아리가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.slice(0, PREVIEW_LIMIT).map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
                {app.image ? (
                  <Image
                    src={app.image}
                    alt={app.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <DefaultClubImage className="object-cover" sizes="56px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {app.name}
                    </h4>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      신청일: {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    color={
                      app.status === 'PENDING'
                        ? 'warning'
                        : app.status === 'APPROVED'
                          ? 'success'
                          : 'danger'
                    }
                    variant="soft"
                    className="shrink-0"
                  >
                    {app.status === 'PENDING'
                      ? '대기중'
                      : app.status === 'APPROVED'
                        ? '승인됨'
                        : '거절됨'}
                  </Chip>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyPage() {
  return (
    <div className="pb-6">
      <ProfileSection />
      <AdminSection />
      <QuestionsListSection />
      <AnsweredListSection />
      <PendingQuestionsSection />
      <WaitingListSection />
      <LikedClubsSection />
      <InterestedClubsSection />
      <MyApplicationsSection />
      <ClubApplyButton />
    </div>
  );
}
