import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType =
  | 'NEW_QUESTION'
  | 'NEW_ANSWER'
  | 'CLUB_APPLICATION'
  | 'FAVORITE_RECRUIT_START'
  | 'FAVORITE_RECRUIT_D_DAY';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
};

const INITIAL: NotificationItem[] = [
  {
    id: '1',
    type: 'NEW_QUESTION',
    title: '새 질문이 도착했어요',
    body: '"KUK Play" 동아리에 새 질문이 등록되었습니다.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    link: '/mypage/questions',
  },
  {
    id: '2',
    type: 'NEW_ANSWER',
    title: '질문에 답변이 달렸어요',
    body: '"동아리 활동 시간이 어떻게 되나요?" 질문에 답변이 등록되었습니다.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    link: '/mypage/waiting',
  },
  {
    id: '3',
    type: 'CLUB_APPLICATION',
    title: '동아리 신청 알림',
    body: '새 동아리 "봉사나눔터" 개설 신청이 접수되었습니다. 승인 검토해 주세요.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    link: '/admin',
  },
  {
    id: '4',
    type: 'FAVORITE_RECRUIT_START',
    title: '관심 동아리 모집 시작',
    body: '관심 동아리 "컴공 학술 소모임" 모집이 시작되었어요.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    link: '/clubs/3',
  },
  {
    id: '5',
    type: 'FAVORITE_RECRUIT_D_DAY',
    title: '모집 마감 D-1',
    body: '관심 동아리 "캠퍼스 사진동아리" 모집이 내일 마감됩니다.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
    link: '/clubs/4',
  },
];

interface NotificationState {
  items: NotificationItem[];
}

interface NotificationActions {
  hasUnread: () => boolean;
  markAsRead: (id: string) => void;
  getItems: () => NotificationItem[];
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      items: INITIAL,
      hasUnread: () => get().items.some((n) => !n.read),
      markAsRead: (id) =>
        set((state) => ({
          items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      getItems: () => get().items,
    }),
    { name: 'notifications' }
  )
);
