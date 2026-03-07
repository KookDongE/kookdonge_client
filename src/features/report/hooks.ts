'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ReportRes } from '@/types/api';

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
