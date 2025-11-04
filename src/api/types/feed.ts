import { z } from "zod"

export const PostUrlReqSchema = z.object({
  postUrl: z.string(),
})

export const FeedCreatedReqSchema = z.object({
  content: z.string(),
  postUrls: z.array(PostUrlReqSchema),
})

export const ClubFeedResSchema = z.object({
  feedId: z.number().int(),
  content: z.string(),
  postUrls: z.array(z.string()),
})

export const ClubFeedListResSchema = z.object({
  clubFeedList: z.array(ClubFeedResSchema),
})

export const PresignedUrlReqSchema = z.object({
  fileName: z.string(),
})

export const PresignedUrlListReqSchema = z.object({
  presignedUrlList: z.array(PresignedUrlReqSchema),
})

export const PresignedUrlResSchema = z.object({
  presignedUrl: z.string(),
  fileUrl: z.string(),
  s3Key: z.string(),
})

export const PresignedUrlListResSchema = z.object({
  presignedUrlList: z.array(PresignedUrlResSchema),
})

export type PostUrlReq = z.infer<typeof PostUrlReqSchema>
export type FeedCreatedReq = z.infer<typeof FeedCreatedReqSchema>
export type ClubFeedRes = z.infer<typeof ClubFeedResSchema>
export type ClubFeedListRes = z.infer<typeof ClubFeedListResSchema>
export type PresignedUrlReq = z.infer<typeof PresignedUrlReqSchema>
export type PresignedUrlListReq = z.infer<typeof PresignedUrlListReqSchema>
export type PresignedUrlRes = z.infer<typeof PresignedUrlResSchema>
export type PresignedUrlListRes = z.infer<typeof PresignedUrlListResSchema>
