import type { ClubPost, ClubQuestion } from "./types"

export const mockPosts: ClubPost[] = [
  {
    feedId: 1,
    content: "주간 코딩 스터디 세션! 알고리즘 문제 풀이 중 💻",
    postUrls: ["/post-coding-session.jpg"],
    id: 1,
    clubId: 1,
    imageUrl: "/post-coding-session.jpg",
    caption: "주간 코딩 스터디 세션! 알고리즘 문제 풀이 중 💻",
    likeCount: 45,
  },
  {
    feedId: 2,
    content: "팀 프로젝트 발표 준비 완료! 🚀",
    postUrls: ["/post-team-project.jpg"],
    id: 2,
    clubId: 1,
    imageUrl: "/post-team-project.jpg",
    caption: "팀 프로젝트 발표 준비 완료! 🚀",
    likeCount: 67,
  },
  {
    feedId: 3,
    content: "해커톤 참가 중! 열심히 개발하고 있습니다 🔥",
    postUrls: ["/post-hackathon.jpg"],
    id: 3,
    clubId: 1,
    imageUrl: "/post-hackathon.jpg",
    caption: "해커톤 참가 중! 열심히 개발하고 있습니다 🔥",
    likeCount: 89,
  },
  {
    feedId: 4,
    content: "정기 공연 준비 중! 🎸🎹",
    postUrls: ["/post-band-practice.jpg"],
    id: 4,
    clubId: 2,
    imageUrl: "/post-band-practice.jpg",
    caption: "정기 공연 준비 중! 🎸🎹",
    likeCount: 34,
  },
  {
    feedId: 5,
    content: "지난주 공연 성황리에 마쳤습니다! 감사합니다 🎵",
    postUrls: ["/post-concert.jpg"],
    id: 5,
    clubId: 2,
    imageUrl: "/post-concert.jpg",
    caption: "지난주 공연 성황리에 마쳤습니다! 감사합니다 🎵",
    likeCount: 56,
  },
]

export const mockQuestions: ClubQuestion[] = [
  {
    id: 1,
    createdAt: "2025-02-28T00:00:00Z",
    question: "프로그래밍 경험이 전혀 없어도 지원 가능한가요?",
    answer: "네, 가능합니다! 초보자를 위한 기초 스터디 과정이 준비되어 있습니다.",
    userId: 1,
    userName: "김철수",
    clubId: 1,
    answeredAt: "2025-02-28",
    isAnswered: true,
  },
  {
    id: 2,
    createdAt: "2025-02-28T00:00:00Z",
    question: "활동비는 얼마인가요?",
    answer: "학기당 5만원이며, 스터디 자료와 간식비로 사용됩니다.",
    userId: 2,
    userName: "이영희",
    clubId: 1,
    answeredAt: "2025-02-28",
    isAnswered: true,
  },
  {
    id: 3,
    createdAt: "2025-02-28T00:00:00Z",
    question: "주로 어떤 프로젝트를 진행하나요?",
    answer: "",
    userId: 3,
    userName: "박민수",
    clubId: 1,
    isAnswered: false,
  },
]

export function getPostsByClubId(clubId: number): ClubPost[] {
  return mockPosts.filter((post) => post.clubId === clubId)
}

export function getQuestionsByClubId(clubId: number): ClubQuestion[] {
  return mockQuestions.filter((q) => q.clubId === clubId)
}
