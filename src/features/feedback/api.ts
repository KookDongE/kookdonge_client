import type { FeedbackCreateReq, FeedbackRes } from '@/types/api';
import { apiClient } from '@/lib/api';

export const feedbackApi = {
  /** POST /api/feedbacks - 버그 신고 / 건의사항 접수 */
  create: async (data: FeedbackCreateReq): Promise<void> => {
    return apiClient<void>('/api/feedbacks', {
      method: 'POST',
      body: data,
    });
  },
};

/** 관리자 전용 피드백 API */
export const adminFeedbackApi = {
  getList: async (params?: {
    status?: 'PENDING' | 'COMPLETED';
    feedbackType?: 'BUG_REPORT' | 'SUGGESTION';
    page?: number;
    size?: number;
    sort?: string[];
  }): Promise<{
    content: FeedbackRes[];
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
    if (params?.feedbackType) query.feedbackType = params.feedbackType;
    if (sort.length) query.sort = Array.isArray(sort) ? sort[0] : sort;
    return apiClient('/api/admin/feedbacks', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
  },

  getOne: async (feedbackId: number): Promise<FeedbackRes> => {
    return apiClient<FeedbackRes>(`/api/admin/feedbacks/${feedbackId}`);
  },

  complete: async (feedbackId: number): Promise<void> => {
    return apiClient<void>(`/api/admin/feedbacks/${feedbackId}/complete`, {
      method: 'PATCH',
    });
  },
};
