'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CompleteRegistrationReq,
  LoginReq,
  ReissueAccessTokenReq,
} from '@/types/api';

import { registerDeviceWithBackend } from '@/features/device/register-device';

import { authApi } from './api';
import { useAuthStore } from './store';

function registerDeviceAfterLogin() {
  registerDeviceWithBackend().catch(() => {});
}

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

export function useMyProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authApi.getMyProfile,
    enabled: !!accessToken,
  });
}

/** OAuth 인증 (Google Grant Code). newUser면 registrationToken 반환 → completeRegistration 호출 필요 */
export function useLogin() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: (data: LoginReq) => authApi.authenticate(data),
    onSuccess: (res) => {
      if (res.accessToken && res.refreshToken) {
        setTokens(res.accessToken, res.refreshToken);
        queryClient.invalidateQueries({ queryKey: authKeys.profile() });
        registerDeviceAfterLogin();
      }
    },
  });
}

/** 회원가입 완료 (추가 정보). authenticate에서 newUser + registrationToken 받은 후 호출 */
export function useRegister() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: (data: CompleteRegistrationReq) => authApi.completeRegistration(data),
    onSuccess: (res) => {
      if (res.accessToken && res.refreshToken) {
        setTokens(res.accessToken, res.refreshToken);
        queryClient.invalidateQueries({ queryKey: authKeys.profile() });
        registerDeviceAfterLogin();
      }
    },
  });
}

export function useReissueToken() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: (data: ReissueAccessTokenReq) => authApi.reissueToken(data),
    onSuccess: (res) => {
      if (res.accessToken && res.refreshToken) {
        setTokens(res.accessToken, res.refreshToken);
      }
    },
  });
}
