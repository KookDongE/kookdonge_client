import type { KyInstance } from "ky"

import type { AnswerCreateReq, Page, Pageable, QuestionAnswerRes, QuestionCreateReq } from "../types"

export const questionEndpoints = (client: KyInstance) => ({
  getQuestions: async (clubId: number, params: Pageable): Promise<Page<QuestionAnswerRes>> => {
    return client
      .get("api/clubs/questions", {
        searchParams: {
          club: clubId,
          ...(params as Record<string, string | number>),
        },
      })
      .json<Page<QuestionAnswerRes>>()
  },

  createQuestion: async (clubId: number, req: QuestionCreateReq): Promise<QuestionAnswerRes> => {
    return client.post(`api/clubs/${clubId}/questions`, { json: req }).json<QuestionAnswerRes>()
  },

  registerAnswer: async (questionId: number, req: AnswerCreateReq): Promise<QuestionAnswerRes> => {
    return client.put(`api/clubs/questions/${questionId}/answer`, { json: req }).json<QuestionAnswerRes>()
  },
})
