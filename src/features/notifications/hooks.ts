'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { notificationApi } from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => [...notificationKeys.all, 'list', page, size] as const,
  infiniteList: (size: number) => [...notificationKeys.all, 'infinite', size] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

const DEFAULT_PAGE_SIZE = 20;

/** 알림 목록 조회 (페이지네이션) - 로그인 시에만 호출 */
export function useNotifications(page = 0, size = DEFAULT_PAGE_SIZE) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: () => notificationApi.getNotifications(page, size),
    enabled: !!accessToken,
  });
}

/** 알림 목록 무한 스크롤 (20개씩) - 로그인 시에만 호출 */
export function useNotificationsInfinite(size = DEFAULT_PAGE_SIZE) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: notificationKeys.infiniteList(size),
    queryFn: ({ pageParam }) => notificationApi.getNotifications(pageParam as number, size),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? (lastPage.page ?? 0) + 1 : undefined),
    initialPageParam: 0,
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
