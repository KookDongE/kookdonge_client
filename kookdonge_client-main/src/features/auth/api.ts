import {
  LoginReq,
  LoginRes,
  RegisterUserReq,
  RegisterUserRes,
  ReissueAccessTokenReq,
  ReissueAccessTokenRes,
  UserProfileRes,
} from '@/types/api';

const DUMMY_PROFILE: UserProfileRes = {
  externalUserId: 'dummy-user-id',
  email: 'dummy@kookmin.ac.kr',
  studentId: '20230001',
  phoneNumber: '010-0000-0000',
  department: '컴퓨터공학부',
  clubId: 1,
};

export const authApi = {
  login: async (_data: LoginReq): Promise<LoginRes> => {
    return {
      externalUserId: DUMMY_PROFILE.externalUserId,
      email: DUMMY_PROFILE.email,
      studentId: DUMMY_PROFILE.studentId,
      phoneNumber: DUMMY_PROFILE.phoneNumber,
      department: DUMMY_PROFILE.department,
      accessToken: 'dummy-access-token',
      refreshToken: 'dummy-refresh-token',
    };
  },

  register: async (_data: RegisterUserReq): Promise<RegisterUserRes> => {
    return {
      externalUserId: DUMMY_PROFILE.externalUserId,
      email: DUMMY_PROFILE.email,
      studentId: DUMMY_PROFILE.studentId,
      phoneNumber: DUMMY_PROFILE.phoneNumber,
      department: DUMMY_PROFILE.department,
      accessToken: 'dummy-access-token',
      refreshToken: 'dummy-refresh-token',
    };
  },

  reissueToken: async (_data: ReissueAccessTokenReq): Promise<ReissueAccessTokenRes> => {
    return { accessToken: 'dummy-access-token' };
  },

  getMyProfile: async (): Promise<UserProfileRes> => {
    return DUMMY_PROFILE;
  },
};
