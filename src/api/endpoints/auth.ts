import type { KyInstance } from "ky"

import type {
  ClubListRes,
  LoginReq,
  LoginRes,
  RegisterUserReq,
  RegisterUserRes,
  ReissueAccessTokenReq,
  ReissueAccessTokenRes,
  UserProfileRes,
} from "../types"

export const authEndpoints = (client: KyInstance) => ({
  login: async (req: LoginReq): Promise<LoginRes> => {
    return client
      .post("api/auth", {
        searchParams: {
          request: JSON.stringify({
            timestamp: new Date().toISOString(),
            data: req,
          }),
        },
      })
      .json<LoginRes>()
  },

  reissueAccessToken: async (req: ReissueAccessTokenReq): Promise<ReissueAccessTokenRes> => {
    return client
      .post("api/auth/reissue", {
        searchParams: {
          request: JSON.stringify({
            timestamp: new Date().toISOString(),
            data: req,
          }),
        },
      })
      .json<ReissueAccessTokenRes>()
  },

  getMyProfile: async (): Promise<UserProfileRes> => {
    return client.get("api/users/me").json<UserProfileRes>()
  },

  registerUser: async (req: RegisterUserReq): Promise<RegisterUserRes> => {
    return client.post("api/users/me", { json: req }).json<RegisterUserRes>()
  },

  getMyLikedClubs: async (): Promise<ClubListRes[]> => {
    return client.get("api/users/me/liked-clubs").json<ClubListRes[]>()
  },
})
