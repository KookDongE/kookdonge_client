import type { ClubCategory, ClubType, RecruitmentStatus } from "@/api/types"

export const categoryToKorean: Record<ClubCategory, string> = {
  PERFORMING_ARTS: "공연예술",
  LIBERAL_ARTS_SERVICE: "교양봉사",
  EXHIBITION_ARTS: "전시예술",
  RELIGION: "종교",
  BALL_LEISURE: "구기레저",
  PHYSICAL_MARTIAL_ARTS: "체육무도",
  ACADEMIC: "학술",
}

export const koreanToCategory: Record<string, ClubCategory> = {
  공연예술: "PERFORMING_ARTS",
  교양봉사: "LIBERAL_ARTS_SERVICE",
  전시예술: "EXHIBITION_ARTS",
  종교: "RELIGION",
  구기레저: "BALL_LEISURE",
  체육무도: "PHYSICAL_MARTIAL_ARTS",
  학술: "ACADEMIC",
}

export const clubTypeToKorean: Record<ClubType, string> = {
  CENTRAL: "중앙",
  DEPARTMENTAL: "학과",
}

export const recruitmentStatusToKorean: Record<RecruitmentStatus, string> = {
  RECRUITING: "모집중",
  SCHEDULED: "모집예정",
  CLOSED: "모집마감",
}
