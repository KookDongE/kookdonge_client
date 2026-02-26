import { apiClient } from '@/lib/api';
import {
  NotificationListRes,
  UnreadCountRes,
} from '@/types/api';

export const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationListRes> => {
    return apiClient<NotificationListRes>('/api/notifications', {
      params: { page, size },
    });
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
