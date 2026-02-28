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

/**
 * FCM 토큰 발급. Firebase 설정 및 브라우저 알림 권한이 있을 때만 유효한 토큰 반환.
 * 설정이 없으면 null 반환 (이때 디바이스 등록은 fcmToken: 'web-pending'으로 함).
 * 서비스 워커를 먼저 등록한 뒤 getToken을 호출해 백그라운드 수신이 동작하도록 함.
 */
export async function getFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured() || !vapidKey) return null;
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    const registration = await getServiceWorkerRegistration().catch(() => null);
    const token = await getToken(messagingInstance, {
      vapidKey,
      ...(registration && { serviceWorkerRegistration: registration }),
    });
    return token || null;
  } catch {
    return null;
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
