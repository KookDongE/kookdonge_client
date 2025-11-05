import type { Club, ClubRanking, CompetitionRate } from "./types"

const mockRankings: ClubRanking[] = [
  {
    id: 1,
    name: "KMU 개발자 연합",
    logoImage: "/coding-laptop-developer.jpg",
    introduction: "백엔드/프론트 합동 스터디 & 프로젝트 진행",
    type: "CENTRAL",
    category: "ACADEMIC",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    weeklyViewGrowth: 120,
    weeklyLikeGrowth: 45,
    dday: 12,
  },
  {
    id: 2,
    name: "뮤직스테이션",
    logoImage: "/music-band-instruments.jpg",
    introduction: "밴드 음악 동아리, 정기 공연 및 합주 활동",
    type: "CENTRAL",
    category: "PERFORMING_ARTS",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    weeklyViewGrowth: 85,
    weeklyLikeGrowth: 32,
    dday: 17,
  },
]

export const mockClubs: Club[] = [
  {
    id: 1,
    name: "KMU 개발자 연합",
    logoImage: "/coding-laptop-developer.jpg",
    introduction: "백엔드/프론트 합동 스터디 & 프로젝트 진행",
    type: "CENTRAL",
    category: "ACADEMIC",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    dday: 12,
  },
  {
    id: 2,
    name: "뮤직스테이션",
    logoImage: "/music-band-instruments.jpg",
    introduction: "밴드 음악 동아리, 정기 공연 및 합주 활동",
    type: "CENTRAL",
    category: "PERFORMING_ARTS",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    dday: 17,
  },
  {
    id: 3,
    name: "봉사나눔",
    logoImage: "/volunteer-community.jpg",
    introduction: "지역사회 봉사활동 및 나눔 실천",
    type: "DEPARTMENTAL",
    category: "LIBERAL_ARTS_SERVICE",
    recruitmentStatus: "SCHEDULED",
    isLikedByMe: false,
    dday: 0,
  },
  {
    id: 4,
    name: "디자인씽킹",
    logoImage: "/design-thinking-creative.jpg",
    introduction: "UX/UI 디자인 스터디 및 프로젝트",
    type: "CENTRAL",
    category: "ACADEMIC",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    dday: 7,
  },
  {
    id: 5,
    name: "영화감상회",
    logoImage: "/movie-cinema-film.jpg",
    introduction: "주간 영화 감상 및 토론",
    type: "DEPARTMENTAL",
    category: "EXHIBITION_ARTS",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    dday: 22,
  },
  {
    id: 6,
    name: "환경지킴이",
    logoImage: "/environment-nature-green.jpg",
    introduction: "캠퍼스 환경 보호 및 정화 활동",
    type: "CENTRAL",
    category: "LIBERAL_ARTS_SERVICE",
    recruitmentStatus: "RECRUITING",
    isLikedByMe: false,
    dday: 28,
  },
]

export function getClubById(id: string | number): Club | undefined {
  return mockClubs.find((club) => club.id === Number(id))
}

export function calculateCompetitionRate(): CompetitionRate {
  const clickRate = Math.random() * 5
  let estimatedLevel: "낮음" | "보통" | "높음" = "낮음"

  if (clickRate > 3) estimatedLevel = "높음"
  else if (clickRate > 1.5) estimatedLevel = "보통"

  return {
    clickRate: Number.parseFloat(clickRate.toFixed(2)),
    estimatedLevel,
    clickCount: Math.floor(Math.random() * 100) + 20,
    viewCount: Math.floor(Math.random() * 1000) + 500,
  }
}

export function getViewsRankings(): ClubRanking[] {
  return mockRankings
}

export function getLikesRankings(): ClubRanking[] {
  return mockRankings
}
