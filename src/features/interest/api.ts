import { ClubInInterestListDto } from '@/types/api';
import { apiClient } from '@/lib/api';

/** 관심 등록/취소·목록 (Interest API). 알림(Subscription)과 별도. */
export const interestApi = {
  getMyInterests: async (): Promise<ClubInInterestListDto[]> => {
    const data = await apiClient<ClubInInterestListDto[]>('/api/users/me/interests');
    return Array.isArray(data) ? data : [];
  },

  addInterest: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/interest`, { method: 'POST' });
  },

  removeInterest: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/interest`, { method: 'DELETE' });
  },
};
