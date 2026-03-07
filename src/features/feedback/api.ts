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
    // Spring Data 호환: createdAt,desc (소문자)
if (sort.length) {
  const s = Array.isArray(sort) ? sort[0] : sort;
  query.sort =
    typeof s === 'string'
      ? s.replace(/,DESC$/i, ',desc').replace(/,ASC$/i, ',asc')
      : s;
}
    const raw = await apiClient<
      | { content: FeedbackRes[]; totalPages?: number; totalElements?: number; size?: number; number?: number; first?: boolean; last?: boolean; empty?: boolean }
      | FeedbackRes[]
    >('/api/admin/feedbacks', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
    // 백엔드가 페이지 객체 { content: [] } 또는 배열 [] 직접 반환하는 경우 모두 처리
    if (Array.isArray(raw)) {
      return {
        content: raw,
        totalPages: 1,
        totalElements: raw.length,
        size: raw.length,
        number: 0,
        first: true,
        last: true,
        empty: raw.length === 0,
      };
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as { content?: FeedbackRes[] }).content)) {
      return {
        content: (raw as { content: FeedbackRes[] }).content,
        totalPages: (raw as { totalPages?: number }).totalPages ?? 0,
        totalElements: (raw as { totalElements?: number }).totalElements ?? 0,
        size: (raw as { size?: number }).size ?? 20,
        number: (raw as { number?: number }).number ?? 0,
        first: (raw as { first?: boolean }).first ?? true,
        last: (raw as { last?: boolean }).last ?? true,
        empty: (raw as { empty?: boolean }).empty ?? false,
      };
    }
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      size: params?.size ?? 20,
      number: params?.page ?? 0,
      first: true,
      last: true,
      empty: true,
    };
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
