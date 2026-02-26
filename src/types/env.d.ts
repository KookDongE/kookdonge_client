declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
    /** PWA 아이콘 등에 사용할 사이트 절대 URL (예: https://kookdonge.co.kr). 설정 시 manifest 아이콘 경로가 절대 URL로 내려가서 폰 홈 추가 시 아이콘 인식이 잘 됨 */
    NEXT_PUBLIC_APP_URL?: string;
    /** FCM 푸시 알림용 (동아리 승인/거절, Q&A, 관심동아리 모집 등). 설정 시 로그인 후 디바이스에 FCM 토큰 등록 */
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    NEXT_PUBLIC_FIREBASE_APP_ID?: string;
    /** Firebase Console > 프로젝트 설정 > Cloud Messaging > 웹 푸시 인증서 에서 발급한 키 */
    NEXT_PUBLIC_FIREBASE_VAPID_KEY?: string;
  }
}
