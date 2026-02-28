'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, Chip, Spinner } from '@heroui/react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

import { ClubType } from '@/types/api';
import { authApi } from '@/features/auth/api';
import { useMyProfile } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/store';
import { useLikedClubs, useManagedClubs, useMyApplications } from '@/features/club/hooks';
import { useInterestedStore } from '@/features/club/interested-store';
import { deviceApi } from '@/features/device/api';
import { getOrCreateDeviceId } from '@/features/device/device-id';
import { useMyQuestions, usePendingQuestions, useQuestions } from '@/features/question/hooks';
import { useMyWaitingList } from '@/features/waiting-list/hooks';

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학술동아리',
  CLUB: '동아리',
};

/** 마이페이지 목록 미리보기 최대 개수 (이상은 전체보기에서만 표시) */
const PREVIEW_LIMIT = 4;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      aria-label="Toggle theme"
    >
      {/* Sun icon for dark mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="hidden h-5 w-5 dark:block"
      >
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>
      {/* Moon icon for light mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="block h-5 w-5 dark:hidden"
      >
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
          clipRule="evenodd"
        />
      </svg>
    </motion.button>
  );
}

function SettingsDropdown({
  onLogout,
  onWithdraw,
}: {
  onLogout: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        로그아웃
      </button>
      <button
        type="button"
        onClick={onWithdraw}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
      >
        회원탈퇴
      </button>
    </div>
  );
}

function ProfileSection() {
  const { data: profile, isLoading } = useMyProfile();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [settingsOpen]);

  const handleLogout = async () => {
    setSettingsOpen(false);
    if (!confirm('로그아웃 하시겠습니까?')) return;
    const refreshToken = useAuthStore.getState().refreshToken;
    const deviceId = typeof window !== 'undefined' ? getOrCreateDeviceId() : '';
    try {
      if (refreshToken) await authApi.logout({ refreshToken });
    } catch {
      // 서버 오류 시에도 로컬 로그아웃 진행
    }
    if (deviceId) {
      deviceApi.deleteDevice(deviceId).catch(() => {});
    }
    clearAuth();
    router.replace('/');
  };

  const handleWithdraw = async () => {
    setSettingsOpen(false);
    if (
      !confirm('정말 회원탈퇴를 하시겠습니까?\n탈퇴 후 모든 데이터가 삭제되며 복구할 수 없습니다.')
    )
      return;
    try {
      await authApi.withdraw();
      clearAuth();
      router.replace('/');
      alert('회원탈퇴가 완료되었습니다.');
    } catch {
      // apiClient에서 toast.error로 서버 메시지 표시 (유일한 관리자인 동아리 있으면 탈퇴 불가 등)
    }
  };

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
          {/* 다크모드 토글 */}
          <ThemeToggle />
          {/* 설정 버튼 */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen((prev) => !prev);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 ${
                settingsOpen ? 'bg-zinc-200 dark:bg-zinc-700' : ''
              }`}
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
            </motion.button>
            {/* 설정 버튼 클릭 시 로그아웃·회원탈퇴 드롭다운 표시 */}
            {settingsOpen && (
              <SettingsDropdown onLogout={handleLogout} onWithdraw={handleWithdraw} />
            )}
          </div>
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
  const { data: profile } = useMyProfile();

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
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700" />
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
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700" />
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
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700" />
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
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-700" />
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
