import {
  ClubFeedListRes,
  ClubFeedRes,
  FeedCreatedReq,
  FeedUpdateReq,
  FileInfoResponse,
  FileUploadCompleteRequest,
  PresignedUrlResponse,
} from '@/types/api';
import { apiClient } from '@/lib/api';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  validateImageFile,
} from '@/lib/image-upload-validation';

export { ALLOWED_IMAGE_EXTENSIONS, validateImageFile } from '@/lib/image-upload-validation';

const CONTENT_TYPE_TO_EXT: Record<string, (typeof ALLOWED_IMAGE_EXTENSIONS)[number]> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/** API가 snake_case(post_urls 등)로 올 수 있으므로 피드 목록을 camelCase로 정규화 */
function normalizeClubFeedListRes(raw: unknown): ClubFeedListRes {
  const o = raw as Record<string, unknown>;
  const list = (o.clubFeedList ?? o.club_feed_list) as Array<Record<string, unknown>> | undefined;
  const clubFeedList = (list ?? []).map((feed): ClubFeedRes => {
    const urls = feed.postUrls ?? feed.post_urls;
    const feedId = feed.feedId ?? feed.feed_id;
    const createdAt = feed.createdAt ?? feed.created_at;
    return {
      feedId: typeof feedId === 'number' ? feedId : Number(feedId),
      content: typeof feed.content === 'string' ? feed.content : '',
      postUrls: Array.isArray(urls) ? (urls as string[]) : [],
      createdAt: typeof createdAt === 'string' ? createdAt : undefined,
    };
  });
  return {
    clubFeedList,
    currentPage: (o.currentPage ?? o.current_page) as number | undefined,
    totalPages: (o.totalPages ?? o.total_pages) as number | undefined,
    totalElements: (o.totalElements ?? o.total_elements) as number | undefined,
    hasNext: (o.hasNext ?? o.has_next) as boolean | undefined,
  };
}

export const feedApi = {
  getClubFeeds: async (clubId: number, page = 0, size = 10): Promise<ClubFeedListRes> => {
    const raw = await apiClient<unknown>(`/api/clubs/${clubId}/feeds`, {
      params: { page, size },
    });
    return normalizeClubFeedListRes(raw);
  },

  /** 단일 피드 조회 (GET /api/clubs/{clubId}/feeds/{feedId}) - 스웨거 ResponseDTOClubFeedRes → data: ClubFeedRes */
  getFeed: async (clubId: number, feedId: number): Promise<ClubFeedRes> => {
    const raw = await apiClient<unknown>(`/api/clubs/${clubId}/feeds/${feedId}`);
    const o = (raw ?? {}) as Record<string, unknown>;
    const postUrls = Array.isArray(o.postUrls)
      ? (o.postUrls as string[])
      : Array.isArray(o.post_urls)
        ? (o.post_urls as string[])
        : [];
    const fileUuids = Array.isArray(o.fileUuids)
      ? (o.fileUuids as string[])
      : Array.isArray(o.file_uuids)
        ? (o.file_uuids as string[])
        : undefined;
    return {
      feedId: Number(o.feedId ?? o.feed_id ?? feedId),
      content: typeof o.content === 'string' ? o.content : '',
      postUrls,
      fileUuids: fileUuids?.length === postUrls.length ? fileUuids : undefined,
      createdAt:
        typeof o.createdAt === 'string'
          ? o.createdAt
          : typeof o.created_at === 'string'
            ? o.created_at
            : undefined,
    };
  },

  createFeed: async (clubId: number, data: FeedCreatedReq): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/feeds`, {
      method: 'POST',
      body: data,
    });
  },

  updateFeed: async (clubId: number, feedId: number, data: FeedUpdateReq): Promise<void> => {
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
    return apiClient<PresignedUrlResponse>(`/api/clubs/${clubId}/files/presigned-url`, {
      params: { fileName, contentType },
    });
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
   * S3 직접 업로드 시 CORS/403 발생 시 S3 버킷 CORS 설정(Origin, Method, Header) 확인 필요.
   */
  uploadFeedFiles: async (
    clubId: number,
    files: File[]
  ): Promise<Array<{ uuid: string; fileUrl: string }>> => {
    const result: Array<{ uuid: string; fileUrl: string }> = [];
    for (const file of files) {
      validateImageFile(file);

      let ext = (file.name.split('.').pop()?.toLowerCase() ?? '').replace(/[^a-z]/g, '');
      if (
        !ext ||
        !ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])
      ) {
        ext = CONTENT_TYPE_TO_EXT[file.type || 'image/jpeg'] ?? 'jpeg';
      }
      const contentType = file.type || 'image/jpeg';
      const fileSize = Number(file.size) || 0;

      // 1. Presigned URL 발급: GET /api/clubs/{clubId}/files/presigned-url?fileName=...&contentType=...
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

      // 2. S3 직접 업로드: presignedUrl로 PUT (Binary). 추가 헤더 최소화하여 CORS preflight 일치.
      try {
        const putRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType },
          mode: 'cors',
        });
        if (!putRes.ok) {
          const text = await putRes.text();
          if (putRes.status === 403) {
            throw new Error(
              'S3 업로드가 거부되었습니다(403). S3 버킷 CORS 설정에서 현재 사이트 Origin과 PUT·OPTIONS 메서드를 허용해 주세요.'
            );
          }
          throw new Error(`S3 업로드 실패: ${putRes.status} ${text}`);
        }
      } catch (err) {
        if (err instanceof Error) {
          const isCorsOrNetwork =
            err instanceof TypeError && /failed to fetch|network|cors/i.test(err.message);
          if (isCorsOrNetwork) {
            throw new Error(
              'S3 업로드 중 CORS 오류가 발생했습니다. S3 버킷 CORS에 현재 사이트 Origin과 PUT·OPTIONS를 허용해 주세요.'
            );
          }
          throw err;
        }
        throw new Error('S3 업로드 중 오류가 발생했습니다.');
      }

      // 3. DB 완료 등록: POST /api/clubs/{clubId}/files (uuid, fileName, fileSize, extension)
      await feedApi.registerUploadComplete(clubId, {
        uuid,
        fileName: file.name,
        fileSize,
        extension: ext,
      });
      result.push({ uuid, fileUrl });
    }
    return result;
  },
};
