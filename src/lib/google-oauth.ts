/**
 * 프론트엔드 Google OAuth 2.0 (Authorization Code flow)
 * - 로그인 버튼 클릭 시 Google 로그인 페이지로 리다이렉트
 * - Google이 redirect_uri?code=...&state=... 로 콜백
 * - 콜백에서 code를 추출해 POST /api/auth 로 전송
 */

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = ['openid', 'email', 'profile'];
export const OAUTH_STATE_KEY = 'kookdonge-oauth-state';

function getClientId(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
  }
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
}

/** 앱의 Google OAuth 콜백 URL. Spring Security 기본값과 동일 (Google Cloud Console에도 동일 URI 등록 필요) */
const OAUTH_REDIRECT_URI = 'https://www.kookdonge.co.kr/login/oauth2/code/google';

export function getRedirectUri(): string {
  return OAUTH_REDIRECT_URI;
}

/** CSRF용 state 랜덤 문자열 생성 */
function generateState(): string {
  const array = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Google 로그인 페이지로 보낼 URL 생성.
 * state는 sessionStorage에 저장해 두고, 콜백에서 검증한다.
 */
export function getGoogleAuthUrl(): string | null {
  const clientId = getClientId();
  if (!clientId) return null;

  const state = generateState();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(OAUTH_STATE_KEY, state);
    } catch {
      // ignore
    }
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    state,
    access_type: 'online',
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

/** Google OAuth 사용 가능 여부 (NEXT_PUBLIC_GOOGLE_CLIENT_ID 설정 여부) */
export function isGoogleOAuthConfigured(): boolean {
  return !!getClientId();
}
