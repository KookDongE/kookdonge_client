'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Spinner, Switch } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deviceApi } from '@/features/device/api';
import { getOrCreateDeviceId } from '@/features/device/device-id';
import { useNotification } from '@/features/device/use-notification';
import { BellIcon } from '@/components/icons/notification-icon';

/** iOS / Android / 기타(데스크톱 등) 구분 */
function getNotificationGuideOs(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const deviceId = useMemo(() => (typeof window !== 'undefined' ? getOrCreateDeviceId() : ''), []);
  const [guideOs] = useState(() => getNotificationGuideOs());
  const {
    permission,
    isLoading: isPermissionLoading,
    error,
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
  const canToggle = permission === 'granted';

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Link
          href="/mypage/settings"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </Link>
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
                      {canToggle
                        ? '동아리 모집, Q&A 답변 등 알림 수신'
                        : '알림 권한을 허용한 뒤 토글로 켜고 끌 수 있습니다.'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Switch
                    isSelected={notificationEnabled}
                    onChange={(checked) => updateSettings.mutate(!!checked)}
                    isDisabled={isLoading || !canToggle}
                    aria-label="푸시 알림 켜기/끄기"
                  />
                </div>
              </div>
            </div>

            {isSupported && permission !== 'granted' && (
              <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  브라우저 알림 권한
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {permission === 'denied'
                    ? '알림이 차단되어 있습니다. 아래 OS별 방법으로 시스템 설정에서 이 사이트 알림을 허용해 주세요.'
                    : '알림을 받으려면 아래 버튼으로 권한을 허용해 주세요.'}
                </p>
                {error && (
                  <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error.message}</p>
                )}
                {permission === 'default' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => requestPermissionAndRegister()}
                      disabled={isPermissionLoading}
                      className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-700"
                    >
                      {isPermissionLoading ? '처리 중...' : '허용'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                알림 설정 방법
              </p>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {guideOs === 'ios' && (
                  <>
                    <strong>iOS (Safari / 홈 화면에 추가한 앱)</strong>
                    <br />
                    설정 → 알림 → KookDongE(또는 Safari) → 알림 허용을 켜주세요. 이미 차단한 경우
                    브라우저 주소창 왼쪽의 자물쇠/정보 버튼 → 웹사이트 설정 → 알림을 허용으로
                    변경할 수 있습니다.
                  </>
                )}
                {guideOs === 'android' && (
                  <>
                    <strong>Android (Chrome 등)</strong>
                    <br />
                    설정 → 사이트 설정 → 알림 → 이 사이트(kookdonge.co.kr) 알림을 허용해 주세요.
                    또는 주소창 왼쪽 자물쇠 → 사이트 설정 → 알림을 허용으로 변경하세요.
                  </>
                )}
                {guideOs === 'desktop' && (
                  <>
                    <strong>PC (Chrome / Edge 등)</strong>
                    <br />
                    주소창 오른쪽 자물쇠(또는 정보) 아이콘 → 사이트 설정 → 알림을 허용으로
                    변경하세요. 이미 차단한 경우 브라우저 설정에서 해당 사이트 알림을 허용할 수
                    있습니다.
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
