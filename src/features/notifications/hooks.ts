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
    /** 전역 default(refetchOnWindowFocus: false)를 덮어 탭 복귀 시 목록 갱신 */
    refetchOnWindowFocus: true,
    /** FCM이 페이지에 안 올 때(백그라운드·일부 브라우저)에도 목록이 뒤처지지 않게 */
    refetchInterval: 60_000,
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
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

/** 안 읽은 알림 개수 (배지용) - 로그인 시에만 호출 */
export function useUnreadCount() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: !!accessToken,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
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

/** 특정 알림 삭제 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => notificationApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
