import type { ClubFeedRes, QuestionAnswerRes } from "@/api/types"

export type ClubPost = ClubFeedRes & {
  imageUrl?: string
  caption?: string
  likeCount?: number
  clubId?: number
  id?: number
}

export type ClubQuestion = QuestionAnswerRes & {
  clubId?: number
  answeredAt?: string
  isAnswered?: boolean
}
