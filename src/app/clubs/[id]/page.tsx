'use client';

import { Suspense, use, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button, Dropdown, Input, Tabs, TextArea } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';
import { createPortal } from 'react-dom';

import { ClubCategory, ClubType, College, RecruitmentStatus } from '@/types/api';
import { formatQnaDateTime, parseApiIsoToDate } from '@/lib/utils';
import { useMyProfile } from '@/features/auth/hooks';
import { useLoginRequiredModalStore } from '@/features/auth/login-required-modal-store';
import { isClubManager, isSystemAdmin } from '@/features/auth/permissions';
import { useAuthStore } from '@/features/auth/store';
import { useClubDetail, useDeleteClub, useLikeClub, useUnlikeClub } from '@/features/club/hooks';
import { useNotification } from '@/features/device/use-notification';
import { useClubFeeds } from '@/features/feed/hooks';
import { useAddInterest, useMyInterests, useRemoveInterest } from '@/features/interest/hooks';
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
import { ClubDetailHeaderSkeleton, FeedItemSkeleton } from '@/components/common/skeletons';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { EyeIcon, HeartIcon, StarIcon } from '@/components/icons/club-icons';
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
  loginReturnPath,
  onNotificationTurnOnRequest,
}: {
  clubId: number;
  /** 비로그인 시 로그인 모달 복귀 URL */
  loginReturnPath: string;
  onNotificationTurnOnRequest?: (clubId: number) => void;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const openLoginModal = useLoginRequiredModalStore((s) => s.open);
  const { data: profile } = useMyProfile();
  const { data: club, isLoading } = useClubDetail(clubId);
  const deleteClub = useDeleteClub();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const isAdmin = isSystemAdmin(profile);
  const isLeader = isClubManager(profile, clubId);
  const showManageButton = isAdmin || isLeader;
  /** 동아리 리더(동아리장)이면서 시스템 관리자가 아닐 때: 수정·삭제신청만 표시 */
  const isLeaderOnly = isLeader && !isAdmin;
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

  const requireAuthOrOpenModal = () => {
    if (accessToken) return true;
    openLoginModal(loginReturnPath);
    return false;
  };

  const goToReport = () => {
    const reportPath = `/mypage/settings/report?type=club&id=${clubId}`;
    if (!accessToken) {
      openLoginModal(reportPath);
      return;
    }
    router.push(reportPath);
  };

  const handleLikeToggle = () => {
    if (!requireAuthOrOpenModal()) return;
    if (isLiking) return;
    clearActionMessage();
    if (club.isLikedByMe) {
      unlikeClub.mutate(clubId);
    } else {
      likeClub.mutate(clubId);
    }
  };

  const handleInterestedToggle = () => {
    if (!requireAuthOrOpenModal()) return;
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
    if (!requireAuthOrOpenModal()) return;
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

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    setDeleteConfirmName('');
  };

  const handleDeleteConfirm = () => {
    deleteClub.mutate(clubId, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setDeleteConfirmName('');
        router.replace('/home');
      },
    });
  };

  const isDeleteNameMatch = club != null && deleteConfirmName.trim() === (club.name ?? '').trim();

  return (
    <div className="bg-white px-4 py-6 dark:bg-zinc-900">
      <div className="flex gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {club.image ? (
            <>
              <div className="absolute inset-0 bg-white dark:bg-white" aria-hidden />
              <Image src={club.image} alt={club.name} fill className="object-cover" sizes="112px" />
            </>
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
            {club.college && COLLEGE_LABEL[club.college] != null && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {COLLEGE_LABEL[club.college]}
              </span>
            )}
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {CATEGORY_LABEL[club.category]}
            </span>
          </div>
          {/* 동아리 이름: 태그 바로 아래. admin/리더는 더보기(수정·삭제·신고), 일반 유저는 신고 버튼 */}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {club.name}
            </h1>
            {showManageButton ? (
              <Dropdown>
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                    title="더보기"
                    aria-label="동아리 관리 메뉴"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onPress={() => router.push(`/mypage/clubs/${clubId}/manage`)}
                      textValue="수정"
                    >
                      수정
                    </Dropdown.Item>
                    <Dropdown.Item
                      onPress={() => {
                        if (showManageButton) {
                          alert('본인은 신고할 수 없습니다.');
                          return;
                        }
                        goToReport();
                      }}
                      textValue="신고"
                    >
                      신고
                    </Dropdown.Item>
                    {isLeaderOnly ? (
                      <Dropdown.Item
                        onPress={() => router.push(`/mypage/clubs/${clubId}/delete-request`)}
                        textValue="삭제신청"
                        className="text-red-600 dark:text-red-400"
                      >
                        삭제신청
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item
                        onPress={handleDeleteClick}
                        textValue="삭제"
                        className="text-red-600 dark:text-red-400"
                      >
                        삭제
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <Dropdown>
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                    title="더보기"
                    aria-label="동아리 메뉴"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu>
                    <Dropdown.Item onPress={goToReport} textValue="신고하기">
                      신고하기
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}
          </div>
          <p className="mt-1 line-clamp-1 max-h-[1.5rem] min-h-[1.5rem] overflow-hidden text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
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
              className={`flex items-center gap-1 rounded-lg p-1.5 transition-colors active:scale-95 ${
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
              className="flex items-center gap-1 rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400"
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
      {deleteModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-zinc-800">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-zinc-100">
                동아리 삭제
              </h3>
              <p className="mb-3 text-sm text-gray-600 dark:text-zinc-400">
                정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              {club && (
                <>
                  <p className="mb-2 text-sm text-gray-600 dark:text-zinc-400">
                    삭제하려면 동아리 이름{' '}
                    <strong className="text-gray-900 dark:text-zinc-100">
                      &quot;{club.name}&quot;
                    </strong>
                    을(를) 입력하세요.
                  </p>
                  <Input
                    type="text"
                    placeholder="동아리 이름 입력"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="mb-6"
                    autoComplete="off"
                    aria-label="동아리 이름 확인"
                  />
                </>
              )}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onPress={() => {
                    setDeleteModalOpen(false);
                    setDeleteConfirmName('');
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  onPress={handleDeleteConfirm}
                  isPending={deleteClub.isPending}
                  isDisabled={!isDeleteNameMatch}
                >
                  삭제
                </Button>
              </div>
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
    ...(club.location?.trim() ? [{ label: '활동 장소' as const, value: club.location }] : []),
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
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-3 px-4 pt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <p className="text-sm leading-relaxed font-light whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {club.content}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">기본 정보</h3>
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
                  className={`min-w-0 text-right font-normal text-zinc-700 dark:text-zinc-300 ${
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
          <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">외부 링크</h3>
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
            onClick={() => router.push(`/clubs/${clubId}/feed?feedId=${feed.feedId}`)}
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const openLoginModal = useLoginRequiredModalStore((s) => s.open);
  const { data, isLoading } = useQuestions(clubId, { page: 0, size: 20 });
  const { data: profile } = useMyProfile();
  const createQuestion = useCreateQuestion(clubId);
  const deleteQuestion = useDeleteQuestion(clubId);
  const [questionText, setQuestionText] = useState('');
  const [questionMenuOpenId, setQuestionMenuOpenId] = useState<number | null>(null);
  const [answerMenuOpenId, setAnswerMenuOpenId] = useState<number | null>(null);
  const questionMenuRef = useRef<HTMLDivElement>(null);
  const answerMenuRef = useRef<HTMLDivElement>(null);
  const questions = data?.content ?? [];

  const returnPath =
    (pathname ?? '') + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
  const requireAuthOrOpenModal = () => {
    if (accessToken) return true;
    openLoginModal(returnPath || '/home');
    return false;
  };

  useEffect(() => {
    if (questionMenuOpenId == null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (questionMenuRef.current?.contains(e.target as Node)) return;
      setQuestionMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [questionMenuOpenId]);

  useEffect(() => {
    if (answerMenuOpenId == null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (answerMenuRef.current?.contains(e.target as Node)) return;
      setAnswerMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [answerMenuOpenId]);

  const handleSubmit = () => {
    if (!questionText.trim()) return;
    if (!requireAuthOrOpenModal()) return;
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
          isDisabled={!questionText.trim() || createQuestion.isPending}
          isPending={createQuestion.isPending}
          className="absolute top-1/2 right-1.5 shrink-0 -translate-y-1/2"
        >
          등록
        </Button>
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
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                aria-hidden
              >
                Q
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {qna.question}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatQnaDateTime(qna.createdAt)}
                    </p>
                  </div>
                  <div
                    className="relative shrink-0"
                    ref={questionMenuOpenId === qna.id ? questionMenuRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionMenuOpenId((prev) => (prev === qna.id ? null : qna.id))
                      }
                      className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      aria-label="더보기"
                      aria-expanded={questionMenuOpenId === qna.id}
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
                          d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                        />
                      </svg>
                    </button>
                    {questionMenuOpenId === qna.id && (
                      <div
                        className="action-menu-dropdown absolute top-full right-0 z-10 mt-0.5 min-w-[100px] rounded-lg border border-zinc-200 bg-white py-1 dark:border-zinc-700 dark:bg-zinc-800"
                        role="menu"
                      >
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          role="menuitem"
                          onClick={() => {
                            setQuestionMenuOpenId(null);
                            if (
                              profile?.id != null &&
                              qna.userId != null &&
                              profile.id === qna.userId
                            ) {
                              alert('본인은 신고할 수 없습니다.');
                              return;
                            }
                            if (!requireAuthOrOpenModal()) return;
                            router.push(`/mypage/settings/report?type=qna&id=${qna.id}`);
                          }}
                        >
                          신고
                        </button>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          role="menuitem"
                          onClick={() => {
                            setQuestionMenuOpenId(null);
                            deleteQuestion.mutate(qna.id);
                          }}
                          disabled={deleteQuestion.isPending}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {qna.answer}
                      </p>
                      {(qna.answeredBy || qna.answeredAt) && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {[qna.answeredBy, qna.answeredAt && formatQnaDateTime(qna.answeredAt)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <div
                      className="relative shrink-0"
                      ref={answerMenuOpenId === qna.id ? answerMenuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setAnswerMenuOpenId((prev) => (prev === qna.id ? null : qna.id))
                        }
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        aria-label="더보기"
                        aria-expanded={answerMenuOpenId === qna.id}
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
                            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                          />
                        </svg>
                      </button>
                      {answerMenuOpenId === qna.id && (
                        <div
                          className="action-menu-dropdown absolute top-full right-0 z-10 mt-0.5 min-w-[100px] rounded-lg border border-zinc-200 bg-white py-1 dark:border-zinc-700 dark:bg-zinc-800"
                          role="menu"
                        >
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            role="menuitem"
                            onClick={() => {
                              setAnswerMenuOpenId(null);
                              if (profile != null && isClubManager(profile, clubId)) {
                                alert('본인은 신고할 수 없습니다.');
                                return;
                              }
                              if (!requireAuthOrOpenModal()) return;
                              router.push(`/mypage/settings/report?type=qna-answer&id=${qna.id}`);
                            }}
                          >
                            신고
                          </button>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            role="menuitem"
                            onClick={() => {
                              setAnswerMenuOpenId(null);
                              deleteQuestion.mutate(qna.id);
                            }}
                            disabled={deleteQuestion.isPending}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}

function ClubDetailContent({ clubId }: { clubId: number }) {
  const { data: club, isLoading: clubLoading, isError: clubError } = useClubDetail(clubId);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath =
    (pathname ?? '') + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
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
      <ClubHeader
        clubId={clubId}
        loginReturnPath={loginReturnPath}
        onNotificationTurnOnRequest={tryShowNotificationPrompt}
      />
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
