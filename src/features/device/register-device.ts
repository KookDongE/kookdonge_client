'use client';

import { getFcmToken } from '@/lib/firebase';

import { deviceApi } from './api';
import { getOrCreateDeviceId } from './device-id';

/**
 * 로그인 후 호출. 디바이스 ID + FCM 토큰(가능 시)으로 서버에 등록하여
 * 동아리 신청 승인/거절, Q&A 답변·질문, 관심동아리 모집시작·모집마감 D-1 푸시를 받을 수 있게 함.
 * Firebase env 미설정 시 fcmToken은 'web-pending'으로 등록되며 푸시는 오지 않음.
 */
export async function registerDeviceWithBackend(): Promise<void> {
  if (typeof window === 'undefined') return;
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;
  const fcmToken = await getFcmToken();
  await deviceApi.registerDevice({
    deviceId,
    fcmToken: fcmToken ?? 'web-pending',
    platform: 'WEB',
  });
}
