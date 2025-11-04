import { z } from "zod"

export const QuestionCreateReqSchema = z.object({
  question: z.string(),
  userName: z.string(),
})

export const AnswerCreateReqSchema = z.object({
  answer: z.string(),
})

export const QuestionAnswerResSchema = z.object({
  id: z.number().int(),
  createdAt: z.string().datetime(),
  question: z.string(),
  answer: z.string(),
  userId: z.number().int(),
  userName: z.string(),
})

export type QuestionCreateReq = z.infer<typeof QuestionCreateReqSchema>
export type AnswerCreateReq = z.infer<typeof AnswerCreateReqSchema>
export type QuestionAnswerRes = z.infer<typeof QuestionAnswerResSchema>
