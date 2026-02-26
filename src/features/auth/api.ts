import { apiClient } from '@/lib/api';
import {
  CompleteRegistrationReq,
  LoginReq,
  LogoutReq,
  OAuthRes,
  ReissueAccessTokenReq,
  ReissueAccessTokenRes,
  UserProfileRes,
} from '@/types/api';

export const authApi = {
  /** OAuth 인증 (Google Grant Code) - 신규 사용자면 newUser + registrationToken, 기존 사용자면 accessToken + refreshToken */
  authenticate: async (data: LoginReq): Promise<OAuthRes> => {
    return apiClient<OAuthRes>('/api/auth', {
      method: 'POST',
      body: {
        googleGrantCode: data.googleGrantCode,
        ...(data.redirectUri != null && { redirectUri: data.redirectUri }),
      },
    });
  },

  /** 회원가입 완료 (추가 정보 입력) - registrationToken 필수 */
  completeRegistration: async (data: CompleteRegistrationReq): Promise<OAuthRes> => {
    return apiClient<OAuthRes>('/api/auth/register', {
      method: 'POST',
      body: data,
    });
  },

  reissueToken: async (data: ReissueAccessTokenReq): Promise<ReissueAccessTokenRes> => {
    return apiClient<ReissueAccessTokenRes>('/api/auth/reissue', {
      method: 'POST',
      body: data,
    });
  },

  logout: async (data: LogoutReq): Promise<void> => {
    return apiClient<void>('/api/auth/logout', {
      method: 'POST',
      body: data,
    });
  },

  getMyProfile: async (): Promise<UserProfileRes> => {
    return apiClient<UserProfileRes>('/api/users/me');
  },

  withdraw: async (): Promise<void> => {
    return apiClient<void>('/api/users/me', { method: 'DELETE' });
  },
};
