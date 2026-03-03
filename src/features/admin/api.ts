import type { AdminRes, GrantAdminReq } from '@/types/api';
import { apiClient } from '@/lib/api';

export const adminApi = {
  /** GET /api/admin/admins - 시스템 관리자 목록 조회 */
  getAdmins: async (): Promise<AdminRes[]> => {
    const data = await apiClient<AdminRes[] | { admins?: AdminRes[] }>('/api/admin/admins');
    if (Array.isArray(data)) return data;
    if (
      data &&
      typeof data === 'object' &&
      Array.isArray((data as { admins?: AdminRes[] }).admins)
    ) {
      return (data as { admins: AdminRes[] }).admins;
    }
    return [];
  },

  /** POST /api/admin/admins - 시스템 관리자 권한 부여 (이메일로 검색) */
  grantAdmin: async (body: GrantAdminReq): Promise<AdminRes> => {
    return apiClient<AdminRes>('/api/admin/admins', {
      method: 'POST',
      body,
    });
  },

  /** DELETE /api/admin/admins/{userId} - 시스템 관리자 권한 해제 (본인 해제 불가) */
  revokeAdmin: async (userId: number): Promise<void> => {
    return apiClient<void>(`/api/admin/admins/${userId}`, { method: 'DELETE' });
  },
};
