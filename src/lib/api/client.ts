import { toast } from 'sonner';

import { ResponseDTO } from '@/types/api';
import { useAuthStore } from '@/features/auth/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kookdonge.co.kr';

/** JSON 파싱 후 ResponseDTO 반환. 파싱 실패 시 예외 발생 */
function parseJsonResponse<T>(text: string): ResponseDTO<T> {
  const parsed = JSON.parse(text || '{}');
  return typeof parsed === 'object' && parsed !== null
    ? (parsed as ResponseDTO<T>)
    : ({} as ResponseDTO<T>);
}

const PUBLIC_PATHS = ['/', '/login', '/welcome', '/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function redirectToSplashIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (isPublicPath(window.location.pathname)) return;
  useAuthStore.getState().clearAuth();
  window.location.replace('/');
}

/** 401 발생 시 Refresh Token으로 재발급 시도. 동시 요청은 하나의 reissue만 수행 */
let reissuePromise: Promise<boolean> | null = null;

async function tryReissue(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return false;

  const body = {
    timestamp: new Date().toISOString(),
    data: { refreshToken },
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const json = parseJsonResponse<{ accessToken: string; refreshToken: string }>(text);
    if (json?.status === 200 && json?.data?.accessToken && json?.data?.refreshToken) {
      useAuthStore.getState().setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function reissueAndWait(): Promise<boolean> {
  if (!reissuePromise) reissuePromise = tryReissue();
  try {
    return await reissuePromise;
  } finally {
    reissuePromise = null;
  }
}

type RequestOptions<TBody = unknown> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: TBody;
  params?: Record<string, string | number | boolean | undefined>;
  /** false면 body를 { timestamp, data }로 감싸지 않고 그대로 전송 (일부 API용) */
  wrapRequestBody?: boolean;
};

function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const baseUrl = `${API_BASE_URL}${endpoint}`;

  if (!params) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

function getAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function wrapRequest<T>(body: T) {
  return {
    timestamp: new Date().toISOString(),
    data: body,
  };
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const { method = 'GET', headers = {}, body, params, wrapRequestBody = true } = options;
  const token = getAuthToken();

  const hasBody = body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method);
  const shouldWrapBody = hasBody && wrapRequestBody;

  const response = await fetch(buildUrl(endpoint, params), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: hasBody ? JSON.stringify(shouldWrapBody ? wrapRequest(body) : body) : undefined,
  });

  const text = await response.text();
  let json: ResponseDTO<T>;
  try {
    json = parseJsonResponse<T>(text);
  } catch {
    const message =
      response.status >= 500
        ? '서버 일시 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        : '응답을 처리할 수 없습니다.';
    toast.error(message);
    throw new Error(`${response.status}: ${message}`);
  }

  const status = Number(json?.status) || response.status;
  const message = typeof json?.message === 'string' ? json.message : '';

  if (status !== 200) {
    const isUnauthorized = response.status === 401 || status === 401;
    const isAuthHeaderMissing =
      /헤더가\s*존재하지\s*않습니다/i.test(message) ||
      (/authorization/i.test(message) && /헤더|header/i.test(message));

    if (isUnauthorized || isAuthHeaderMissing) {
      // Access Token 만료 시 재발급 시도 (한 번만). 재발급 API는 apiClient를 쓰지 않으므로 401 시 여기서만 처리.
      if (!isRetry) {
        const reissued = await reissueAndWait();
        if (reissued) return apiClient<T>(endpoint, options, true);
      }
      redirectToSplashIfNeeded();
    } else {
      toast.error(message || '오류가 발생했습니다');
    }
    throw new Error(`${status}: ${message}`);
  }

  return json.data as T;
}
