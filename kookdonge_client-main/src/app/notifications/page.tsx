'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { NotificationItem, NotificationType } from '@/features/notifications/notification-store';
import { useNotificationStore } from '@/features/notifications/notification-store';

function typeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    NEW_QUESTION: '새 질문',
    NEW_ANSWER: '답변',
    CLUB_APPLICATION: '동아리 신청',
    FAVORITE_RECRUIT_START: '모집 시작',
    FAVORITE_RECRUIT_D_DAY: '모집 마감 D-1',
  };
  return labels[type];
}

function typeBadgeColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    NEW_QUESTION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    NEW_ANSWER: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CLUB_APPLICATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    FAVORITE_RECRUIT_START: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
    FAVORITE_RECRUIT_D_DAY: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  return colors[type];
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
  const list = useNotificationStore((s) => s.getItems());
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로</span>
        </button>
      </div>
      <div className="px-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">알림</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          새 질문, 답변, 신청, 관심 동아리 모집 알림을 확인하세요.
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-4 px-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <span className="mb-2 text-4xl">🔔</span>
            <p>알림이 없습니다.</p>
          </div>
        ) : (
          list.map((item) => {
            const content = (
              <div
                className={`flex gap-3 rounded-xl border px-4 py-4 transition-colors ${
                  item.read
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
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{item.body}</p>
                </div>
              </div>
            );
            return item.link ? (
              <Link
                key={item.id}
                href={item.link}
                onClick={() => markAsRead(item.id)}
              >
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
