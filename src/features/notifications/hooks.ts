'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { notificationApi } from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => [...notificationKeys.all, 'list', page, size] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

/** 알림 목록 조회 (페이지네이션) - 로그인 시에만 호출 */
export function useNotifications(page = 0, size = 20) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: () => notificationApi.getNotifications(page, size),
    enabled: !!accessToken,
  });
}

/** 안 읽은 알림 개수 (배지용) - 로그인 시에만 호출 */
export function useUnreadCount() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: !!accessToken,
  });
}

/** 특정 알림 읽음 처리 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/** 전체 읽음 처리 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
