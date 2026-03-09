import type { ReportCreateReq, ReportRes } from '@/types/api';
import { apiClient } from '@/lib/api';

export const reportApi = {
  /** POST /api/reports - 신고 접수 */
  create: async (data: ReportCreateReq): Promise<void> => {
    return apiClient<void>('/api/reports', {
      method: 'POST',
      body: data,
    });
  },
};

/** 관리자 전용 신고 API */
export const adminReportApi = {
  getList: async (params?: {
    status?: 'PENDING' | 'COMPLETED';
    reportType?: 'QNA' | 'QNA_ANSWER' | 'CLUB' | 'COMMUNITY_POST' | 'COMMUNITY_COMMENT';
    page?: number;
    size?: number;
    sort?: string[];
  }): Promise<{
    content: ReportRes[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  }> => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;
    const sort = params?.sort ?? ['createdAt,DESC'];
    const query: Record<string, string | number | undefined> = { page, size };
    if (params?.status) query.status = params.status;
    if (params?.reportType) query.reportType = params.reportType;
    if (sort.length) query.sort = Array.isArray(sort) ? sort[0] : sort;
    return apiClient('/api/admin/reports', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
  },

  getOne: async (reportId: number): Promise<ReportRes> => {
    return apiClient<ReportRes>(`/api/admin/reports/${reportId}`);
  },

  complete: async (reportId: number): Promise<void> => {
    return apiClient<void>(`/api/admin/reports/${reportId}/complete`, {
      method: 'PATCH',
    });
  },
};
