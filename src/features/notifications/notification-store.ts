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

const NOTIFICATION_STORAGE_VERSION = 1;

/** 예전에 저장된 형태를 현재 형태로 변환. "couldn't be migrated" 방지 */
function migrateNotificationState(persisted: unknown, _version: number): NotificationState {
  if (persisted && typeof persisted === 'object' && 'state' in persisted) {
    const inner = (persisted as { state?: unknown }).state;
    if (inner && typeof inner === 'object' && 'items' in inner) {
      const items = (inner as { items: unknown }).items;
      return { items: Array.isArray(items) ? items : INITIAL };
    }
  }
  if (persisted && typeof persisted === 'object' && 'items' in persisted) {
    const items = (persisted as { items: unknown }).items;
    return { items: Array.isArray(items) ? items : INITIAL };
  }
  return { items: INITIAL };
}

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
    {
      name: 'notifications',
      version: NOTIFICATION_STORAGE_VERSION,
      migrate: migrateNotificationState,
    }
  )
);
