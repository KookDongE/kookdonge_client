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

const INITIAL: NotificationItem[] = [];

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
