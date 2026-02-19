'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FeedCreatedReq, PresignedUrlListReq } from '@/types/api';

import { feedApi } from './api';

export const feedKeys = {
  all: ['feeds'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: (clubId: number) => [...feedKeys.lists(), clubId] as const,
};

export function useClubFeeds(clubId: number) {
  return useQuery({
    queryKey: feedKeys.list(clubId),
    queryFn: () => feedApi.getClubFeeds(clubId),
    enabled: !!clubId,
  });
}

export function useCreateFeed(clubId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeedCreatedReq) => feedApi.createFeed(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.list(clubId) });
    },
  });
}

export function useGetPresignedUrls(clubId: number) {
  return useMutation({
    mutationFn: (data: PresignedUrlListReq) => feedApi.getPresignedUrls(clubId, data),
  });
}

export function useDeleteFeed(clubId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedId: number) => feedApi.deleteFeed(clubId, feedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.list(clubId) });
    },
  });
}
