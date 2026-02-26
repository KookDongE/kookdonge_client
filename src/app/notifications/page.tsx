'use client';

import { useRouter } from 'next/navigation';

import type { NotificationRes } from '@/types/api';
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from '@/features/notifications/hooks';

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    CLUB_CREATE_REQUEST: '동아리 생성 신청',
    CLUB_CREATE_APPROVED: '동아리 생성 승인',
    CLUB_CREATE_REJECTED: '동아리 생성 거절',
    QNA_QUESTION_CREATED: '새 질문',
    QNA_ANSWER_CREATED: '답변 등록',
    RECRUITMENT_START: '모집 시작',
    RECRUITMENT_DEADLINE: '모집 마감 임박',
  };
  return labels[type] ?? type;
}

function typeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    CLUB_CREATE_REQUEST: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    CLUB_CREATE_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CLUB_CREATE_REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    QNA_QUESTION_CREATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    QNA_ANSWER_CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    RECRUITMENT_START: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
    RECRUITMENT_DEADLINE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
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
  const { data, isLoading } = useNotifications(0, 20);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const list = data?.notifications ?? [];
  const hasNext = data?.hasNext ?? false;

  const handleItemClick = (item: NotificationRes) => {
    markAsRead.mutate(item.id);
    const url = item.redirectUrl ?? '/home';
    router.push(url.startsWith('/') ? url : `/${url}`);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {},
    });
  };

  return (
    <div className="pb-6">
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        {list.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="text-sm font-medium text-blue-500 hover:underline disabled:opacity-50 dark:text-lime-400"
          >
            모두 읽음
          </button>
        )}
      </div>
      <div className="px-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">알림</h1>
      </div>
      <div className="mt-4 flex flex-col gap-4 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>알림을 불러오는 중...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <span className="mb-2 text-4xl">🔔</span>
            <p>알림이 없습니다.</p>
          </div>
        ) : (
          list.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className="w-full text-left"
            >
              <div
                className={`flex gap-3 rounded-xl border px-4 py-4 transition-colors ${
                  item.isRead
                    ? 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50'
                    : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColor(item.type)}`}
                    >
                      {typeLabel(item.type)}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{item.message}</p>
                </div>
              </div>
            </button>
          ))
        )}
        {hasNext && list.length > 0 && (
          <p className="py-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            스크롤을 내리면 다음 알림을 불러옵니다.
          </p>
        )}
      </div>
    </div>
  );
}
