declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
    /** PWA 아이콘 등에 사용할 사이트 절대 URL (예: https://kookdonge.co.kr). 설정 시 manifest 아이콘 경로가 절대 URL로 내려가서 폰 홈 추가 시 아이콘 인식이 잘 됨 */
    NEXT_PUBLIC_APP_URL?: string;
  }
}
