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
   * 스웨거 흐름: Presigned URL 발급 → S3 PUT → POST /files 업로드 완료 등록.
   * 반환된 uuid는 피드 생성 시 fileUuids로, fileUrl은 미리보기 표시용.
   */
  uploadFeedFiles: async (
    clubId: number,
    files: File[]
  ): Promise<Array<{ uuid: string; fileUrl: string }>> => {
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
    const contentTypeToExt: Record<string, (typeof allowed)[number]> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    const result: Array<{ uuid: string; fileUrl: string }> = [];
    for (const file of files) {
      let ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!allowed.includes(ext as (typeof allowed)[number])) {
        ext = contentTypeToExt[file.type || 'image/jpeg'] ?? 'jpeg';
      }
      const contentType = file.type || 'image/jpeg';

      // 1. GET presigned-url (fileName, contentType 쿼리)
      const res = await feedApi.getPresignedUrl(clubId, file.name, contentType);
      const raw = res as PresignedUrlResponse & {
        presigned_url?: string;
        file_url?: string;
      };
      const uuid = raw.uuid;
      const fileUrl = raw.fileUrl ?? raw.file_url ?? '';
      const presignedUrl = raw.presignedUrl ?? raw.presigned_url;
      if (!uuid || !presignedUrl) {
        throw new Error('Presigned URL 응답에 uuid 또는 presignedUrl이 없습니다.');
      }

      // 2. S3에 PUT 업로드
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
      });
      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error(`S3 업로드 실패: ${putRes.status} ${text}`);
      }

      // 3. POST /api/clubs/{clubId}/files 로 업로드 완료 등록 (uuid, fileName, fileSize, extension)
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
