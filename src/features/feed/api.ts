import { apiClient } from '@/lib/api';
import {
  ClubFeedListRes,
  ClubFeedRes,
  FeedCreatedReq,
  FeedUpdateReq,
  FileInfoResponse,
  FileUploadCompleteRequest,
  PresignedUrlResponse,
} from '@/types/api';

export const feedApi = {
  getClubFeeds: async (
    clubId: number,
    page = 0,
    size = 10
  ): Promise<ClubFeedListRes> => {
    return apiClient<ClubFeedListRes>(`/api/clubs/${clubId}/feeds`, {
      params: { page, size },
    });
  },

  getFeed: async (clubId: number, feedId: number): Promise<ClubFeedRes> => {
    return apiClient<ClubFeedRes>(`/api/clubs/${clubId}/feeds/${feedId}`);
  },

  createFeed: async (clubId: number, data: FeedCreatedReq): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/feeds`, {
      method: 'POST',
      body: data,
    });
  },

  updateFeed: async (
    clubId: number,
    feedId: number,
    data: FeedUpdateReq
  ): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/feeds/${feedId}`, {
      method: 'PUT',
      body: data,
    });
  },

  deleteFeed: async (clubId: number, feedId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/feeds/${feedId}`, {
      method: 'DELETE',
    });
  },

  /** Presigned URL 발급 (단일 파일) - fileName, contentType 쿼리 */
  getPresignedUrl: async (
    clubId: number,
    fileName: string,
    contentType: string
  ): Promise<PresignedUrlResponse> => {
    return apiClient<PresignedUrlResponse>(
      `/api/clubs/${clubId}/files/presigned-url`,
      {
        params: { fileName, contentType },
      }
    );
  },

  /** S3 업로드 완료 후 파일 등록 */
  registerUploadComplete: async (
    clubId: number,
    data: FileUploadCompleteRequest
  ): Promise<FileInfoResponse> => {
    return apiClient<FileInfoResponse>(`/api/clubs/${clubId}/files`, {
      method: 'POST',
      body: data,
    });
  },

  deleteFile: async (clubId: number, uuid: string): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/files/${uuid}`, {
      method: 'DELETE',
    });
  },

  /**
   * 파일들을 Presigned URL로 S3 업로드 후 서버에 등록하고, uuid와 fileUrl 목록을 반환합니다.
   * 피드 생성 시 fileUuids로 사용하고, fileUrl은 미리보기 표시용입니다.
   */
  uploadFeedFiles: async (
    clubId: number,
    files: File[]
  ): Promise<Array<{ uuid: string; fileUrl: string }>> => {
    const result: Array<{ uuid: string; fileUrl: string }> = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!allowed.includes(ext)) throw new Error(`지원하지 않는 확장자: ${ext}`);
      const res = await feedApi.getPresignedUrl(
        clubId,
        file.name,
        file.type || 'image/jpeg'
      );
      const uuid = res.uuid;
      const fileUrl = res.fileUrl;
      const presignedUrl =
        res.presignedUrl ?? (res as { presigned_url?: string }).presigned_url;
      if (!presignedUrl) throw new Error('Presigned URL을 받지 못했습니다.');
      const contentType = file.type || 'image/jpeg';
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
      });
      if (!putRes.ok) {
        throw new Error(`S3 업로드 실패: ${putRes.status}`);
      }
      await feedApi.registerUploadComplete(clubId, {
        uuid,
        fileName: file.name,
        fileSize: file.size,
        extension: ext,
      });
      result.push({ uuid, fileUrl });
    }
    return result;
  },
};
