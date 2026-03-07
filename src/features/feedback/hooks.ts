'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminFeedbackApi } from './api';

export const adminFeedbackKeys = {
  all: ['admin', 'feedbacks'] as const,
  list: (params?: {
    status?: 'PENDING' | 'COMPLETED';
    feedbackType?: string;
    page?: number;
    size?: number;
  }) => [...adminFeedbackKeys.all, 'list', params] as const,
  detail: (id: number) => [...adminFeedbackKeys.all, 'detail', id] as const,
};

export function useAdminFeedbacks(params?: {
  status?: 'PENDING' | 'COMPLETED';
  feedbackType?: 'BUG_REPORT' | 'SUGGESTION';
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = params ?? {};
  return useQuery({
    queryKey: adminFeedbackKeys.list(rest),
    queryFn: () => adminFeedbackApi.getList(rest),
    enabled,
  });
}

export function useAdminFeedbackDetail(feedbackId: number, enabled = true) {
  return useQuery({
    queryKey: adminFeedbackKeys.detail(feedbackId),
    queryFn: () => adminFeedbackApi.getOne(feedbackId),
    enabled: !!feedbackId && enabled,
  });
}

export function useCompleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: number) => adminFeedbackApi.complete(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminFeedbackKeys.all });
    },
  });
}
