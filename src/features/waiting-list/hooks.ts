'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { waitingListApi } from './api';

export const waitingListKeys = {
  all: ['waitingList'] as const,
  mine: () => [...waitingListKeys.all, 'mine'] as const,
};

export function useMyWaitingList() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: waitingListKeys.mine(),
    queryFn: waitingListApi.getMyWaitingList,
    enabled: !!accessToken,
  });
}

export function useAddToWaitingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => waitingListApi.addToWaitingList(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitingListKeys.all });
    },
  });
}

export function useRemoveFromWaitingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => waitingListApi.removeFromWaitingList(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitingListKeys.all });
    },
  });
}
