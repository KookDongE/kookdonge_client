import { apiClient } from '@/lib/api';
import {
  DeviceRegisterReq,
  NotificationSettingReq,
  NotificationSettingRes,
} from '@/types/api';

export const deviceApi = {
  registerDevice: async (data: DeviceRegisterReq): Promise<void> => {
    return apiClient<void>('/api/devices', { method: 'POST', body: data });
  },

  deleteDevice: async (deviceId: string): Promise<void> => {
    return apiClient<void>(`/api/devices/${deviceId}`, { method: 'DELETE' });
  },

  getNotificationSettings: async (deviceId: string): Promise<NotificationSettingRes> => {
    return apiClient<NotificationSettingRes>(
      `/api/devices/${deviceId}/notification-settings`
    );
  },

  updateNotificationSettings: async (
    deviceId: string,
    data: NotificationSettingReq
  ): Promise<void> => {
    return apiClient<void>(`/api/devices/${deviceId}/notification-settings`, {
      method: 'PATCH',
      body: data,
    });
  },
};
