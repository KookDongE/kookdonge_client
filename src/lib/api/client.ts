import { toast } from 'sonner';

import { ResponseDTO } from '@/types/api';
import { useAuthStore } from '@/features/auth/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kookdonge.co.kr';

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

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

  const json: ResponseDTO<T> = await response.json();

  if (json.status !== 200) {
    const isUnauthorized = response.status === 401 || json.status === 401;
    if (isUnauthorized && !token) {
      // 스플래시·로그인 등 토큰 없을 때 401은 예상됨. 토스트 생략
    } else {
      toast.error(json.message || '오류가 발생했습니다');
    }
    throw new Error(`${json.status}: ${json.message}`);
  }

  return json.data;
}
