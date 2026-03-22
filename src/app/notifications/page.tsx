'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import type { NotificationRes } from '@/types/api';
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationsInfinite,
  useUnreadCount,
} from '@/features/notifications/hooks';
import { NotificationCardSkeleton } from '@/components/common/skeletons';
import { SwipeableNotificationItem } from '@/components/notifications/swipeable-notification-item';

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    CLUB_CREATE_REQUEST: '동아리 생성 신청',
    CLUB_CREATE_APPROVED: '동아리 생성 승인',
    CLUB_CREATE_REJECTED: '동아리 생성 반려',
    CLUB_DELETE_REQUEST: '동아리 삭제 신청',
    CLUB_DELETE_APPROVED: '동아리 삭제 승인',
    CLUB_DELETE_REJECTED: '동아리 삭제 반려',
    CLUB_MEMBER_ADDED: '관리 권한 부여',
    QNA_QUESTION_CREATED: '새 질문',
    QNA_ANSWER_CREATED: '답변 등록',
    RECRUITMENT_START: '모집 시작',
    RECRUITMENT_DEADLINE: '모집 마감 임박',
    COMMUNITY_COMMENT: '댓글',
    COMMUNITY_REPLY: '답글',
    COMMUNITY_POPULAR: '인기글',
  };
  return labels[type] ?? type;
}

function typeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    CLUB_CREATE_REQUEST: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    CLUB_CREATE_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CLUB_CREATE_REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    CLUB_DELETE_REQUEST: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    CLUB_DELETE_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CLUB_DELETE_REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    CLUB_MEMBER_ADDED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    QNA_QUESTION_CREATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    QNA_ANSWER_CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    RECRUITMENT_START: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
    RECRUITMENT_DEADLINE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    COMMUNITY_COMMENT: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    COMMUNITY_REPLY: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    COMMUNITY_POPULAR: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return colors[type] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300';
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function NotificationsPage() {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotificationsInfinite(20);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const list = data?.pages.flatMap((p) => p.notifications) ?? [];
  const hasNext = hasNextPage ?? false;
  const hasUnread = unreadCount > 0;

  // 날짜 기준 그룹핑: 오늘 / 어제 / 최근 7일 / 이전
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7DaysAgo = new Date(startOfToday);
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);

  const todayList: NotificationRes[] = [];
  const yesterdayList: NotificationRes[] = [];
  const recent7List: NotificationRes[] = [];
  const olderList: NotificationRes[] = [];

  for (const item of list) {
    const createdAt = new Date(item.createdAt);
    if (createdAt >= startOfToday) {
      todayList.push(item);
    } else if (createdAt >= startOfYesterday && createdAt < startOfToday) {
      yesterdayList.push(item);
    } else if (createdAt >= startOf7DaysAgo) {
      recent7List.push(item);
    } else {
      olderList.push(item);
    }
  }

  const handleItemClick = (item: NotificationRes) => {
    if (!item.isRead) {
      markAsRead.mutate(item.id, {
        onSuccess: () => {
          goToRedirect(item);
        },
      });
    } else {
      goToRedirect(item);
    }
  };

  /** redirectUrl에서 questionId 쿼리 추출 (백엔드가 URL로만 내려줄 때) */
  function parseQuestionIdFromUrl(url: string): number | undefined {
    try {
      const match = url.match(/[?&]questionId=(\d+)/);
      return match ? parseInt(match[1], 10) : undefined;
    } catch {
      return undefined;
    }
  }

  /** Q&A 알림: 항상 앱 경로로 이동(404 방지), questionId 있으면 해당 질문까지 스크롤 */
  function buildQnaRedirectUrl(
    type: 'QNA_QUESTION_CREATED' | 'QNA_ANSWER_CREATED',
    clubId: number,
    questionId?: number
  ): string {
    const q = new URLSearchParams();
    q.set('tab', 'qna');
    if (questionId != null && Number.isInteger(questionId)) q.set('questionId', String(questionId));
    const query = q.toString();
    if (type === 'QNA_QUESTION_CREATED') {
      return `/mypage/clubs/${clubId}/manage${query ? `?${query}` : ''}`;
    }
    return `/clubs/${clubId}${query ? `?${query}` : ''}`;
  }

  /** API redirectUrl 우선 사용. Q&A는 앱 경로로 직접 구성해 404 방지 + 질문 스크롤 지원 */
  function goToRedirect(item: NotificationRes) {
    const { type, clubId, redirectUrl, questionId: resQuestionId } = item;
    const isQna = type === 'QNA_QUESTION_CREATED' || type === 'QNA_ANSWER_CREATED';

    if (isQna && clubId != null) {
      const questionId =
        resQuestionId ?? (redirectUrl?.trim() ? parseQuestionIdFromUrl(redirectUrl) : undefined);
      router.push(buildQnaRedirectUrl(type, clubId, questionId));
      return;
    }

    if (redirectUrl?.trim()) {
      const url = redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`;
      if (!url.startsWith('http')) {
        router.push(url);
        return;
      }
    }

    switch (type) {
      case 'RECRUITMENT_START':
      case 'RECRUITMENT_DEADLINE':
        if (clubId != null) {
          router.push(`/clubs/${clubId}`);
          return;
        }
        break;
      case 'CLUB_CREATE_APPROVED':
      case 'CLUB_CREATE_REJECTED':
        router.push('/my/club-requests');
        return;
      case 'CLUB_CREATE_REQUEST':
        router.push('/admin/applications');
        return;
      default:
        break;
    }
    router.push('/home');
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined);
  };

  // 무한 스크롤: sentinel이 보이면 다음 페이지 로드
  useEffect(() => {
    if (!hasNext || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: '100px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="pb-6">
      <div className="flex flex-col gap-4 px-4 pt-2">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <NotificationCardSkeleton key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>알림이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 전체 읽기: 읽지 않은 알림이 있을 때만 표시 */}
            {list.length > 0 && hasUnread && (
              <div className="flex justify-end pt-1 pb-0.5">
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsRead.isPending}
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {markAllAsRead.isPending ? '처리 중...' : '전체 읽기'}
                </button>
              </div>
            )}
            {/* 오늘 */}
            {todayList.length > 0 && (
              <>
                <div className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  오늘
                </div>
                {todayList.map((item) => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    typeLabel={typeLabel}
                    typeBadgeColor={typeBadgeColor}
                    formatTime={formatTime}
                    onTap={() => handleItemClick(item)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                    isDeleting={
                      deleteNotification.isPending && deleteNotification.variables === item.id
                    }
                  />
                ))}
              </>
            )}

            {/* 어제 */}
            {yesterdayList.length > 0 && (
              <>
                <div className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  어제
                </div>
                {yesterdayList.map((item) => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    typeLabel={typeLabel}
                    typeBadgeColor={typeBadgeColor}
                    formatTime={formatTime}
                    onTap={() => handleItemClick(item)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                    isDeleting={
                      deleteNotification.isPending && deleteNotification.variables === item.id
                    }
                  />
                ))}
              </>
            )}

            {/* 최근 7일 (오늘 포함) */}
            {recent7List.length > 0 && (
              <>
                <div className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  최근 7일
                </div>
                {recent7List.map((item) => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    typeLabel={typeLabel}
                    typeBadgeColor={typeBadgeColor}
                    formatTime={formatTime}
                    onTap={() => handleItemClick(item)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                    isDeleting={
                      deleteNotification.isPending && deleteNotification.variables === item.id
                    }
                  />
                ))}
              </>
            )}

            {/* 이전 */}
            {olderList.length > 0 && (
              <>
                <div className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  이전
                </div>
                {olderList.map((item) => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    typeLabel={typeLabel}
                    typeBadgeColor={typeBadgeColor}
                    formatTime={formatTime}
                    onTap={() => handleItemClick(item)}
                    onDelete={(id) => deleteNotification.mutate(id)}
                    isDeleting={
                      deleteNotification.isPending && deleteNotification.variables === item.id
                    }
                  />
                ))}
              </>
            )}
          </div>
        )}
        {hasNext && list.length > 0 && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage ? (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">알림 불러오는 중...</span>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                스크롤하면 더 불러옵니다
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
