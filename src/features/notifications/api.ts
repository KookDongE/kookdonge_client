import type { NotificationListRes, NotificationRes, UnreadCountRes } from '@/types/api';
import { apiClient } from '@/lib/api';

/** 서버가 notifications / content(Spring Page) / data 등 다양한 키로 목록을 줄 수 있음 */
type NotificationsRaw = Record<string, unknown> & {
  notifications?: NotificationRes[];
  content?: NotificationRes[];
  notificationList?: NotificationRes[];
  list?: NotificationRes[];
  data?: { notifications?: NotificationRes[]; content?: NotificationRes[] };
  hasNext?: boolean;
  page?: number;
  size?: number;
};

function extractNotificationList(raw: NotificationsRaw | null | undefined): NotificationRes[] {
  if (!raw || typeof raw !== 'object') return [];
  const fromNested = raw.data && typeof raw.data === 'object';
  const inner = fromNested ? (raw.data as Record<string, unknown>) : raw;
  const keys = ['notifications', 'content', 'notificationList', 'list', 'items', 'results'];
  for (const key of keys) {
    const val = inner[key];
    if (Array.isArray(val) && val.length >= 0) {
      return val as NotificationRes[];
    }
  }
  return [];
}

/** 댓글/답글 본문이 올 수 있는 API 필드명 후보 (camel + snake) */
const CONTENT_KEYS = [
  'content',
  'commentContent',
  'comment_content',
  'body',
  'text',
  'originalContent',
  'original_content',
] as const;

function pickContent(item: Record<string, unknown>): string | undefined {
  for (const key of CONTENT_KEYS) {
    const val = item[key];
    if (val != null && String(val).trim() !== '') return String(val).trim();
  }
  return undefined;
}

function normalizeItem(item: Record<string, unknown>): NotificationRes {
  return {
    id: Number(item.id),
    type: String(item.type ?? ''),
    title: String(item.title ?? ''),
    message: String(item.message ?? ''),
    content: pickContent(item),
    redirectUrl: item.redirectUrl != null ? String(item.redirectUrl) : undefined,
    clubId: item.clubId != null ? Number(item.clubId) : undefined,
    questionId: item.questionId != null ? Number(item.questionId) : undefined,
    isRead: Boolean(item.isRead ?? item.read ?? false),
    createdAt: String(item.createdAt ?? ''),
  };
}

export const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationListRes> => {
    const raw = await apiClient<NotificationsRaw>('/api/notifications', {
      params: { page, size },
    });
    const list = extractNotificationList(raw).map((it) =>
      typeof it === 'object' && it !== null ? normalizeItem(it as Record<string, unknown>) : it
    );
    const fromNested = raw?.data && typeof raw.data === 'object';
    const meta = fromNested ? (raw.data as Record<string, unknown>) : raw;
    return {
      notifications: list,
      hasNext: Boolean(meta?.hasNext ?? raw?.hasNext ?? false),
      page: Number(meta?.page ?? raw?.page ?? page),
      size: Number(meta?.size ?? raw?.size ?? size),
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const data = await apiClient<UnreadCountRes>('/api/notifications/unread-count');
    return data?.unreadCount ?? 0;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    return apiClient<void>(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return apiClient<void>('/api/notifications/read-all', { method: 'PATCH' });
  },

  /** 특정 알림 삭제 (DELETE /api/notifications/{notificationId}) */
  deleteNotification: async (notificationId: number): Promise<void> => {
    return apiClient<void>(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
