import { z } from "zod"

export const ClubTypeEnum = z.enum(["CENTRAL", "DEPARTMENTAL"])
export const ClubCategoryEnum = z.enum([
  "PERFORMING_ARTS",
  "LIBERAL_ARTS_SERVICE",
  "EXHIBITION_ARTS",
  "RELIGION",
  "BALL_LEISURE",
  "PHYSICAL_MARTIAL_ARTS",
  "ACADEMIC",
])
export const RecruitmentStatusEnum = z.enum(["RECRUITING", "SCHEDULED", "CLOSED"])

export const ClubListResSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  logoImage: z.string(),
  introduction: z.string(),
  type: ClubTypeEnum,
  category: ClubCategoryEnum,
  recruitmentStatus: RecruitmentStatusEnum,
  isLikedByMe: z.boolean(),
  dday: z.number().int(),
})

export const ClubDetailResSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  image: z.string(),
  type: ClubTypeEnum,
  targetGraduate: z.string(),
  leaderName: z.string(),
  location: z.string(),
  weeklyActiveFrequency: z.number(),
  recruitmentStatus: RecruitmentStatusEnum,
  recruitmentStartDate: z.string().datetime(),
  recruitmentEndDate: z.string().datetime(),
  totalLikeCount: z.number().int(),
  totalViewCount: z.number().int(),
  isLikedByMe: z.boolean(),
  description: z.string(),
  category: ClubCategoryEnum,
  allowLeaveOfAbsence: z.boolean(),
})

export const ClubRankingResSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  logoImage: z.string(),
  introduction: z.string(),
  type: ClubTypeEnum,
  category: ClubCategoryEnum,
  recruitmentStatus: RecruitmentStatusEnum,
  isLikedByMe: z.boolean(),
  weeklyViewGrowth: z.number().int(),
  weeklyLikeGrowth: z.number().int(),
  dday: z.number().int(),
})

export const ClubInWaitingListDtoSchema = z.object({
  clubId: z.number().int(),
  clubName: z.string(),
  clubProfileImageUrl: z.string(),
  clubType: ClubTypeEnum,
})

export type ClubType = z.infer<typeof ClubTypeEnum>
export type ClubCategory = z.infer<typeof ClubCategoryEnum>
export type RecruitmentStatus = z.infer<typeof RecruitmentStatusEnum>
export type ClubListRes = z.infer<typeof ClubListResSchema>
export type ClubDetailRes = z.infer<typeof ClubDetailResSchema>
export type ClubRankingRes = z.infer<typeof ClubRankingResSchema>
export type ClubInWaitingListDto = z.infer<typeof ClubInWaitingListDtoSchema>
