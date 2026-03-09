'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ReportRes, ReportType } from '@/types/api';
import { clubApi } from '@/features/club/api';
import * as communityApi from '@/features/community/api';
import { questionApi } from '@/features/question/api';

import { adminReportApi } from './api';

export const adminReportKeys = {
  all: ['admin', 'reports'] as const,
  list: (params?: {
    status?: 'PENDING' | 'COMPLETED';
    reportType?: string;
    page?: number;
    size?: number;
  }) => [...adminReportKeys.all, 'list', params] as const,
  detail: (id: number) => [...adminReportKeys.all, 'detail', id] as const,
};

export function useAdminReports(params?: {
  status?: 'PENDING' | 'COMPLETED';
  reportType?: 'QNA' | 'CLUB' | 'COMMUNITY_POST' | 'COMMUNITY_COMMENT';
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = params ?? {};
  return useQuery({
    queryKey: adminReportKeys.list(rest),
    queryFn: () => adminReportApi.getList(rest),
    enabled,
  });
}

export function useAdminReportDetail(reportId: number, enabled = true) {
  return useQuery({
    queryKey: adminReportKeys.detail(reportId),
    queryFn: () => adminReportApi.getOne(reportId),
    enabled: !!reportId && enabled,
  });
}

export function useCompleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: number) => adminReportApi.complete(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReportKeys.all });
    },
  });
}

const reportedContentKeys = {
  post: (contentId: number) => ['reportedContent', 'post', contentId] as const,
  club: (contentId: number) => ['reportedContent', 'club', contentId] as const,
  question: (contentId: number) => ['reportedContent', 'question', contentId] as const,
};

/**
 * 신고 대상 원글 내용을 contentId + reportType으로 조회.
 * COMMUNITY_POST → 게시글 상세, CLUB → 동아리 상세, QNA → 질문 상세, COMMUNITY_COMMENT → API 없음(서버 contentSnapshot 사용).
 */
export function useReportedContent(
  reportType: ReportType | undefined,
  contentId: number | undefined,
  enabled: boolean
) {
  const postQuery = useQuery({
    queryKey: reportedContentKeys.post(contentId ?? 0),
    queryFn: () => communityApi.getPost(contentId!),
    enabled: enabled && reportType === 'COMMUNITY_POST' && !!contentId,
  });
  const clubQuery = useQuery({
    queryKey: reportedContentKeys.club(contentId ?? 0),
    queryFn: () => clubApi.getClubDetail(contentId!),
    enabled: enabled && reportType === 'CLUB' && !!contentId,
  });
  const questionQuery = useQuery({
    queryKey: reportedContentKeys.question(contentId ?? 0),
    queryFn: () => questionApi.getQuestion(contentId!),
    enabled: enabled && reportType === 'QNA' && !!contentId,
  });

  if (reportType === 'COMMUNITY_POST' && postQuery.isSuccess && postQuery.data) {
    const d = postQuery.data;
    const title = d.title ?? '';
    const content = d.content ?? '';
    return {
      content: [title, content].filter(Boolean).join('\n\n'),
      isLoading: false,
      isError: false,
    };
  }
  if (reportType === 'CLUB' && clubQuery.isSuccess && clubQuery.data) {
    const d = clubQuery.data;
    const parts = [`[동아리] ${d.name}`, d.description, d.content].filter(Boolean);
    return {
      content: parts.join('\n\n'),
      isLoading: false,
      isError: false,
    };
  }
  if (reportType === 'QNA' && questionQuery.isSuccess && questionQuery.data) {
    const d = questionQuery.data;
    const parts = [`[질문] ${d.question ?? ''}`, d.answer ? `[답변] ${d.answer}` : ''].filter(
      Boolean
    );
    return {
      content: parts.join('\n\n'),
      isLoading: false,
      isError: false,
    };
  }
  if (reportType === 'COMMUNITY_COMMENT') {
    return { content: null, isLoading: false, isError: false };
  }

  const isLoading =
    (reportType === 'COMMUNITY_POST' && postQuery.isLoading) ||
    (reportType === 'CLUB' && clubQuery.isLoading) ||
    (reportType === 'QNA' && questionQuery.isLoading);
  const isError =
    (reportType === 'COMMUNITY_POST' && postQuery.isError) ||
    (reportType === 'CLUB' && clubQuery.isError) ||
    (reportType === 'QNA' && questionQuery.isError);

  return {
    content: null,
    isLoading,
    isError,
  };
}
