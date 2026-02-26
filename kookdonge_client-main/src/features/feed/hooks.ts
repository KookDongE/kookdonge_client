'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FeedCreatedReq } from '@/types/api';

import { feedApi } from './api';

export const feedKeys = {
  all: ['feeds'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: (clubId: number) => [...feedKeys.lists(), clubId] as const,
};

export function useClubFeeds(clubId: number, page = 0, size = 10) {
  return useQuery({
    queryKey: feedKeys.list(clubId),
    queryFn: () => feedApi.getClubFeeds(clubId, page, size),
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

/** 피드용 이미지 업로드 (S3 + 등록) 후 uuid/fileUrl 목록 반환 */
export function useUploadFeedFiles(clubId: number) {
  return useMutation({
    mutationFn: (files: File[]) => feedApi.uploadFeedFiles(clubId, files),
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
