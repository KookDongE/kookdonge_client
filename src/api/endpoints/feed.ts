import type { KyInstance } from "ky"

import type { ClubFeedListRes, ClubFeedRes, FeedCreatedReq, PresignedUrlListReq, PresignedUrlListRes } from "../types"

export const feedEndpoints = (client: KyInstance) => ({
  getFeedList: async (clubId: number): Promise<ClubFeedListRes> => {
    return client
      .get("api/feeds", {
        searchParams: { club: clubId },
      })
      .json<ClubFeedListRes>()
  },

  getFeed: async (feedId: number): Promise<ClubFeedRes> => {
    return client.get(`api/feeds/${feedId}`).json<ClubFeedRes>()
  },

  createFeed: async (clubId: number, req: FeedCreatedReq): Promise<void> => {
    await client.post("api/feeds", {
      searchParams: { club: clubId },
      json: req,
    })
  },

  generatePresignedUrls: async (clubId: number, req: PresignedUrlListReq): Promise<PresignedUrlListRes> => {
    return client
      .post("api/presigned-urls", {
        searchParams: { club: clubId },
        json: req,
      })
      .json<PresignedUrlListRes>()
  },
})
