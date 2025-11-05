import type { Notification } from "./types"

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "waitlist",
    title: "모집 시작!",
    message: "KMU 개발자 연합 동아리가 모집을 시작했습니다. 지금 바로 지원해 보세요!",
    clubId: "1",
    clubName: "KMU 개발자 연합",
    createdAt: "2025-03-01T09:00:00",
    isRead: false,
  },
  {
    id: "n2",
    type: "answer",
    title: "질문에 답변이 달렸어요",
    message: "디자인씽킹 동아리에서 회원님의 질문에 답변했습니다.",
    clubId: "4",
    clubName: "디자인씽킹",
    createdAt: "2025-02-28T14:30:00",
    isRead: false,
  },
  {
    id: "n3",
    type: "system",
    title: "새로운 동아리가 등록되었어요",
    message: "관심 카테고리(학술)에 새로운 동아리가 추가되었습니다.",
    createdAt: "2025-02-27T10:00:00",
    isRead: true,
  },
  {
    id: "n4",
    type: "waitlist",
    title: "모집 마감 임박",
    message: "영화감상회 동아리 모집이 3일 후 마감됩니다.",
    clubId: "5",
    clubName: "영화감상회",
    createdAt: "2025-02-26T16:00:00",
    isRead: true,
  },
]

export function getNotifications(): Notification[] {
  return mockNotifications
}
