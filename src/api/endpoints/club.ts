import type { KyInstance } from "ky"

import type {
  ClubCategory,
  ClubDetailRes,
  ClubListRes,
  ClubRankingRes,
  ClubType,
  Page,
  Pageable,
  RecruitmentStatus,
} from "../types"

export interface ClubListParams extends Pageable {
  category?: ClubCategory
  type?: ClubType
  recruitmentStatus?: RecruitmentStatus
  targetGraduate?: number
  weeklyActiveFrequency?: number
  query?: string
}

export const clubEndpoints = (client: KyInstance) => ({
  getClubList: async (params: ClubListParams): Promise<Page<ClubListRes>> => {
    return client
      .get("api/clubs", {
        searchParams: params as Record<string, string | number>,
      })
      .json<Page<ClubListRes>>()
  },

  getClubDetail: async (clubId: number): Promise<ClubDetailRes> => {
    return client.get(`api/clubs/${clubId}`).json<ClubDetailRes>()
  },

  addLike: async (clubId: number): Promise<void> => {
    await client.post(`api/clubs/${clubId}/like`)
  },

  removeLike: async (clubId: number): Promise<void> => {
    await client.delete(`api/clubs/${clubId}/like`)
  },

  getTopClubsByWeeklyView: async (params: Pageable): Promise<Page<ClubRankingRes>> => {
    return client
      .get("api/clubs/top/weekly-view", {
        searchParams: params as Record<string, string | number>,
      })
      .json<Page<ClubRankingRes>>()
  },

  getTopClubsByWeeklyLike: async (params: Pageable): Promise<Page<ClubRankingRes>> => {
    return client
      .get("api/clubs/top/weekly-like", {
        searchParams: params as Record<string, string | number>,
      })
      .json<Page<ClubRankingRes>>()
  },
})
