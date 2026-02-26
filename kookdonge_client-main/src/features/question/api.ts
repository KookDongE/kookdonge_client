import { apiClient } from '@/lib/api';
import {
  AnswerCreateReq,
  Pageable,
  PageResponse,
  QuestionAnswerRes,
  QuestionCreateReq,
} from '@/types/api';

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

  registerAnswer: async (
    questionId: number,
    data: AnswerCreateReq
  ): Promise<QuestionAnswerRes> => {
    return apiClient<QuestionAnswerRes>(
      `/api/clubs/questions/${questionId}/answer`,
      {
        method: 'PUT',
        body: data,
      }
    );
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
};
