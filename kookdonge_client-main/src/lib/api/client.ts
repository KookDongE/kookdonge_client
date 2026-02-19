import { toast } from 'sonner';

import { ResponseDTO } from '@/types/api';
import { useAuthStore } from '@/features/auth/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

type RequestOptions<TBody = unknown> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: TBody;
  params?: Record<string, string | number | boolean | undefined>;
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
  const { method = 'GET', headers = {}, body, params } = options;
  const token = getAuthToken();

  const shouldWrapBody = body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method);

  const response = await fetch(buildUrl(endpoint, params), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: shouldWrapBody ? JSON.stringify(wrapRequest(body)) : undefined,
  });

  const json: ResponseDTO<T> = await response.json();

  if (json.status !== 200) {
    toast.error(json.message || '오류가 발생했습니다');
    throw new Error(`${json.status}: ${json.message}`);
  }

  return json.data;
}
