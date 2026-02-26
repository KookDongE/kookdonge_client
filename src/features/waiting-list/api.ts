import { apiClient } from '@/lib/api';
import { ClubInWaitingListDto } from '@/types/api';

export const waitingListApi = {
  getMyWaitingList: async (): Promise<ClubInWaitingListDto[]> => {
    const data = await apiClient<ClubInWaitingListDto[]>('/api/users/me/subscriptions');
    return Array.isArray(data) ? data : [];
  },

  addToWaitingList: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/subscribe`, { method: 'POST' });
  },

  removeFromWaitingList: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/subscribe`, { method: 'DELETE' });
  },
};
