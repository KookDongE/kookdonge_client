import {
  AnswerCreateReq,
  Pageable,
  PageResponse,
  QuestionAnswerRes,
  QuestionCreateReq,
} from '@/types/api';
import { apiClient } from '@/lib/api';

export const questionApi = {
  getQuestions: async (
    clubId: number,
    pageable: Pageable = {}
  ): Promise<PageResponse<QuestionAnswerRes>> => {
    const page = pageable.page ?? 0;
    const size = pageable.size ?? 20;
    const sortParam = pageable.sort ?? ['createdAt,DESC'];
    const sort = Array.isArray(sortParam) ? sortParam[0] : sortParam;
    const data = await apiClient<PageResponse<QuestionAnswerRes>>(
      `/api/clubs/${clubId}/questions`,
      {
        params: { page, size, ...(sort ? { sort } : {}) },
      }
    );
    return data;
  },

  createQuestion: async (clubId: number, data: QuestionCreateReq): Promise<QuestionAnswerRes> => {
    return apiClient<QuestionAnswerRes>(`/api/clubs/${clubId}/questions`, {
      method: 'POST',
      body: data,
    });
  },

  registerAnswer: async (questionId: number, data: AnswerCreateReq): Promise<QuestionAnswerRes> => {
    return apiClient<QuestionAnswerRes>(`/api/clubs/questions/${questionId}/answer`, {
      method: 'PUT',
      body: data,
      wrapRequestBody: false,
    });
  },

  deleteAnswer: async (questionId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/questions/${questionId}/answer`, {
      method: 'DELETE',
    });
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  getPendingQuestions: async (
    clubId: number,
    pageable: Pageable = {}
  ): Promise<PageResponse<QuestionAnswerRes>> => {
    const result = await questionApi.getQuestions(clubId, pageable);
    const pending = (result.content ?? []).filter((q) => !q.answer);
    return {
      ...result,
      content: pending,
      totalElements: pending.length,
      numberOfElements: pending.length,
      last: true,
      empty: pending.length === 0,
    };
  },

  /**
   * 내가 쓴 질문 목록 (전체 동아리).
   * TODO: 백엔드 API 추가 후 연동 (예: GET /api/users/me/questions).
   * 응답에 clubId가 있으면 항목 클릭 시 해당 동아리 Q&A로 이동 가능.
   */
  getMyQuestions: async (pageable: Pageable = {}): Promise<PageResponse<QuestionAnswerRes>> => {
    const page = pageable.page ?? 0;
    const size = pageable.size ?? 20;
    // API 없음 - 빈 목록 반환. API 연동 시 아래 주석 해제 및 수정.
    // return apiClient<PageResponse<QuestionAnswerRes>>('/api/users/me/questions', { params: { page, size } });
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      size,
      number: page,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    };
  },
};
