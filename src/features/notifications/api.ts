import type { NotificationListRes, UnreadCountRes } from '@/types/api';
import { apiClient } from '@/lib/api';

/** 서버가 notifications 또는 content(Spring Page) 등 다른 키로 보낼 수 있음 */
type NotificationsRaw = NotificationListRes & { content?: NotificationListRes['notifications'] };

export const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationListRes> => {
    const raw = await apiClient<NotificationsRaw>('/api/notifications', {
      params: { page, size },
    });
    const list = Array.isArray(raw?.notifications)
      ? raw.notifications
      : Array.isArray(raw?.content)
        ? raw.content
        : [];
    return {
      notifications: list,
      hasNext: raw?.hasNext ?? false,
      page: raw?.page ?? page,
      size: raw?.size ?? size,
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
};
