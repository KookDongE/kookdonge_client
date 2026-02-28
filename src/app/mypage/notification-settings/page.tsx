'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner, Switch } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deviceApi } from '@/features/device/api';
import { getOrCreateDeviceId } from '@/features/device/device-id';
import { useNotification } from '@/features/device/use-notification';
import { BellIcon } from '@/components/icons/notification-icon';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deviceId = useMemo(() => (typeof window !== 'undefined' ? getOrCreateDeviceId() : ''), []);
  const {
    permission,
    isLoading: isPermissionLoading,
    requestPermissionAndRegister,
    isSupported,
  } = useNotification();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['notification-settings', deviceId],
    queryFn: () => deviceApi.getNotificationSettings(deviceId),
    enabled: Boolean(deviceId),
  });

  const updateSettings = useMutation({
    mutationFn: (notificationEnabled: boolean) =>
      deviceApi.updateNotificationSettings(deviceId, { notificationEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', deviceId] });
    },
  });

  const notificationEnabled = settings?.notificationEnabled ?? true;
  const isLoading = isSettingsLoading || updateSettings.isPending;

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </button>
      </div>
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">알림 설정</h1>
      </div>
      <div className="space-y-6 px-4">
        {!deviceId ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            디바이스 정보를 불러오는 중입니다.
          </div>
        ) : isSettingsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                    <BellIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">푸시 알림</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      동아리 모집, Q&A 답변 등 알림 수신
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={notificationEnabled}
                  onChange={(checked) => updateSettings.mutate(!!checked)}
                  isDisabled={isLoading}
                  aria-label="푸시 알림 켜기/끄기"
                />
              </div>
            </div>

            {isSupported && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  브라우저 알림 권한
                </p>
                <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {permission === 'granted'
                    ? '알림 권한이 허용되어 있습니다.'
                    : permission === 'denied'
                      ? '알림이 차단되어 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.'
                      : '알림을 받으려면 아래 버튼으로 권한을 허용해 주세요.'}
                </p>
                {permission !== 'granted' && (
                  <button
                    type="button"
                    onClick={() => requestPermissionAndRegister()}
                    disabled={isPermissionLoading}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-700"
                  >
                    {isPermissionLoading ? '처리 중...' : '알림 권한 허용하기'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
