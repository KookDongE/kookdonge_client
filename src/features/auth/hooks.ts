'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CompleteRegistrationReq, LoginReq, ReissueAccessTokenReq } from '@/types/api';

import { authApi } from './api';
import { useAuthStore } from './store';

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

export function useMyProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const query = useQuery({
    queryKey: authKeys.profile(),
    queryFn: authApi.getMyProfile,
    enabled: !!accessToken,
  });
  /** 비로그인일 때는 프로필 조회를 하지 않으므로 로딩으로 보이면 안 됨(커뮤니티·동아리 공개 화면 스켈레톤 방지) */
  return {
    ...query,
    isLoading: Boolean(accessToken) && query.isLoading,
  };
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
        // 디바이스 등록은 AuthProvider useEffect에서 requestPermissionAndRegister()로 처리
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
        // 디바이스 등록은 AuthProvider useEffect에서 requestPermissionAndRegister()로 처리
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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) => authApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}
