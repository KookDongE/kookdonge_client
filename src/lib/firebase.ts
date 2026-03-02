'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function isFirebaseConfigured(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey
  );
}

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;
  if (messaging) return messaging;
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

const FIREBASE_MESSAGING_SW = '/firebase-messaging-sw.js';

/**
 * FCM용 서비스 워커를 등록하고 등록 객체를 반환.
 * getToken() 전에 호출해야 백그라운드 푸시가 같은 SW에서 수신됨.
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(FIREBASE_MESSAGING_SW, {
      scope: '/',
    });
    await registration.update();
    return registration;
  } catch {
    return null;
  }
}

export type GetFcmTokenResult = {
  /** 발급된 FCM 토큰. 없으면 null */
  token: string | null;
  /** 사용자가 알림 권한을 거부한 경우 true (이때만 서버에 'web-denied' 전달 권장) */
  permissionDenied: boolean;
};

const FCM_TOKEN_RETRY_DELAY_MS = 2500;
const FCM_TOKEN_MAX_RETRIES = 1;

/**
 * FCM 토큰 발급. Firebase 설정 및 브라우저 알림 권한이 있을 때만 유효한 토큰 반환.
 * 설정이 없으면 { token: null, permissionDenied: false } (이때 디바이스 등록은 fcmToken: 'web-pending'으로 함).
 * 서비스 워커를 먼저 등록한 뒤 getToken을 호출해 백그라운드 수신이 동작하도록 함.
 * 재로그인 등으로 SW가 아직 활성화되지 않았을 수 있어, SW 활성화 대기 및 실패 시 재시도를 수행한다.
 */
export async function getFcmToken(): Promise<GetFcmTokenResult> {
  const noToken = (permissionDenied = false): GetFcmTokenResult => ({
    token: null,
    permissionDenied,
  });

  if (typeof window === 'undefined') return noToken();
  if (!isFirebaseConfigured() || !vapidKey) return noToken();
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return noToken();

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return noToken(permission === 'denied');
    }
    const registration = await getServiceWorkerRegistration().catch((e) => {
      console.error('[FCM] 서비스 워커 등록 실패:', e);
      return null;
    });
    // 재로그인 직후 SW가 아직 activating 상태일 수 있으므로 활성화까지 대기 (표준 API, DOM 타입에 없을 수 있음)
    if (registration && 'ready' in registration && registration.ready) {
      await (registration as { ready: Promise<ServiceWorkerRegistration> }).ready;
    }

    const tryGetToken = (): Promise<string | null> =>
      getToken(messagingInstance!, {
        vapidKey: vapidKey!,
        ...(registration && { serviceWorkerRegistration: registration }),
      }).then((t) => t || null);

    let token: string | null = null;
    try {
      token = await tryGetToken();
    } catch (e) {
      console.warn('[FCM] getToken 1차 실패, 재시도 대기:', e);
    }

    // 토큰 미발급 시 재로그인/모바일 등 타이밍 이슈를 위해 한 번 재시도
    if (!token && FCM_TOKEN_MAX_RETRIES > 0) {
      await new Promise((r) => setTimeout(r, FCM_TOKEN_RETRY_DELAY_MS));
      try {
        token = await tryGetToken();
      } catch (e) {
        console.error('[FCM] getToken 재시도 실패:', e);
      }
    }

    if (token) return { token, permissionDenied: false };
    return noToken();
  } catch (e) {
    console.error('[FCM] getToken 실패:', e);
    return noToken();
  }
}

/** 포그라운드에서 Data Message 수신 시 호출될 콜백. 구독 해제 함수 반환. */
export function subscribeForegroundMessage(
  callback: (payload: { data?: Record<string, string> }) => void
): (() => void) | null {
  if (typeof window === 'undefined') return null;
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;
  try {
    return onMessage(messagingInstance, callback);
  } catch {
    return null;
  }
}
