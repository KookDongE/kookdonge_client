'use client';

import { useCallback } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FeedCreatedReq } from '@/types/api';

import { feedApi, validateImageFile } from './api';

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

/**
 * Presigned URL 기반 이미지 업로드 훅 (스웨거 플로우).
 * - Presigned URL 발급 → S3 PUT → POST /files 등록
 * - 확장자: jpg, jpeg, png, gif, webp / 크기: 10MB 이하
 */
export function useImageUpload(clubId: number) {
  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!files.length) return [];
      for (const file of files) validateImageFile(file);
      return feedApi.uploadFeedFiles(clubId, files);
    },
  });

  const uploadImages = useCallback(
    async (files: File[]): Promise<Array<{ uuid: string; fileUrl: string }>> => {
      return mutation.mutateAsync(files);
    },
    [mutation]
  );

  return {
    uploadImages,
    isLoading: mutation.isPending,
    error: mutation.error,
    resetError: mutation.reset,
  };
}

/** 피드용 이미지 업로드 (useImageUpload와 동일 플로우, mutation 형태) */
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
