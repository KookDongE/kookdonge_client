import type { ClubCategory, ClubDetailRes, ClubListRes, ClubRankingRes, ClubType, RecruitmentStatus } from "@/api/types"

export type { ClubCategory, ClubType, RecruitmentStatus, ClubListRes, ClubDetailRes, ClubRankingRes }

export type Club = ClubListRes
export type ClubDetail = ClubDetailRes
export type ClubRanking = ClubRankingRes
export type ClubStatus = RecruitmentStatus

export interface CompetitionRate {
  clickRate: number
  estimatedLevel: "낮음" | "보통" | "높음"
  clickCount: number
  viewCount: number
}

export interface FilterState {
  categories: ClubCategory[]
  types: ClubType[]
  statuses: RecruitmentStatus[]
  grades: number[]
  allowLeaveOfAbsence: boolean
  frequency: number
  search: string
  sort: "latest" | "views" | "likes" | "name"
}
