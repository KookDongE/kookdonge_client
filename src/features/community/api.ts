import { apiClient } from '@/lib/api';
import type { PageResponse } from '@/types/api';
import type {
  CommunityCommentCreateReq,
  CommunityCommentRes,
  CommunityCommentUpdateReq,
  CommunityPostCategory,
  CommunityPostCreateReq,
  CommunityPostDetailRes,
  CommunityPostRes,
  CommunityPostUpdateReq,
  FileInfoResponse,
  FileUploadCompleteRequest,
  ManagedClubRes,
  PresignedUrlResponse,
} from '@/types/api';

/** GET /api/community/posts - 게시글 목록 (category: FREE | PROMOTION, 생략 시 전체) */
export async function getPosts(params: {
  category?: CommunityPostCategory;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { category, page = 0, size = 20, sort = 'createdAt,DESC' } = params;
  const query: Record<string, string | number> = { page, size, sort };
  if (category) query.category = category;
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts', { params: query });
}

/** GET /api/community/posts/{postId} - 게시글 상세 */
export async function getPost(postId: number): Promise<CommunityPostDetailRes> {
  return apiClient<CommunityPostDetailRes>(`/api/community/posts/${postId}`);
}

/** POST /api/community/posts - 게시글 작성 */
export async function createPost(body: CommunityPostCreateReq): Promise<number> {
  return apiClient<number>('/api/community/posts', { method: 'POST', body });
}

/** PUT /api/community/posts/{postId} - 게시글 수정 */
export async function updatePost(
  postId: number,
  body: CommunityPostUpdateReq
): Promise<void> {
  return apiClient<void>(`/api/community/posts/${postId}`, { method: 'PUT', body });
}

/** DELETE /api/community/posts/{postId} - 게시글 삭제 */
export async function deletePost(postId: number): Promise<void> {
  return apiClient<void>(`/api/community/posts/${postId}`, { method: 'DELETE' });
}

/** POST /api/community/posts/{postId}/like - 좋아요 */
export async function likePost(postId: number): Promise<void> {
  return apiClient<void>(`/api/community/posts/${postId}/like`, { method: 'POST' });
}

/** POST /api/community/posts/{postId}/save - 저장 */
export async function savePost(postId: number): Promise<void> {
  return apiClient<void>(`/api/community/posts/${postId}/save`, { method: 'POST' });
}

/** DELETE /api/community/posts/{postId}/save - 저장 취소 */
export async function unsavePost(postId: number): Promise<void> {
  return apiClient<void>(`/api/community/posts/${postId}/save`, { method: 'DELETE' });
}

/** GET /api/community/posts/search - 게시글 검색 */
export async function searchPosts(params: {
  keyword: string;
  category?: CommunityPostCategory;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { keyword, category, page = 0, size = 20, sort = 'createdAt,DESC' } = params;
  const query: Record<string, string | number> = { keyword, page, size, sort };
  if (category) query.category = category;
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts/search', {
    params: query,
  });
}

/** GET /api/community/posts/popular - 인기 게시글 목록 */
export async function getPopularPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { page = 0, size = 20, sort = 'createdAt,DESC' } = params ?? {};
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts/popular', {
    params: { page, size, sort },
  });
}

/** GET /api/community/posts/my - 내가 작성한 게시글 */
export async function getMyPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { page = 0, size = 20, sort = 'createdAt,DESC' } = params ?? {};
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts/my', {
    params: { page, size, sort },
  });
}

/** GET /api/community/posts/my/saved - 내가 저장한 게시글 */
export async function getMySavedPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { page = 0, size = 20, sort = 'createdAt,DESC' } = params ?? {};
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts/my/saved', {
    params: { page, size, sort },
  });
}

/** GET /api/community/posts/my/liked - 내가 좋아요한 게시글 */
export async function getMyLikedPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { page = 0, size = 20, sort = 'createdAt,DESC' } = params ?? {};
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts/my/liked', {
    params: { page, size, sort },
  });
}

/** GET /api/community/posts/my/commented - 내가 댓글 단 게시글 */
export async function getMyCommentedPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PageResponse<CommunityPostRes>> {
  const { page = 0, size = 20, sort = 'createdAt,DESC' } = params ?? {};
  return apiClient<PageResponse<CommunityPostRes>>('/api/community/posts/my/commented', {
    params: { page, size, sort },
  });
}

/** GET /api/community/posts/managed-clubs - 글쓰기 시 선택할 동아리 목록 */
export async function getManagedClubsForPost(): Promise<ManagedClubRes[]> {
  return apiClient<ManagedClubRes[]>('/api/community/posts/managed-clubs');
}

/** GET /api/files/presigned-url - 커뮤니티 이미지 업로드용 Presigned URL */
export async function getPresignedUrl(fileName: string, contentType: string): Promise<PresignedUrlResponse> {
  return apiClient<PresignedUrlResponse>('/api/files/presigned-url', {
    params: { fileName, contentType },
  });
}

/** POST /api/files - 업로드 완료 등록 (커뮤니티). 동아리로 작성 시 clubId 전달 시 file_information.club_id 설정 가능 */
export async function registerFileUpload(body: FileUploadCompleteRequest): Promise<FileInfoResponse> {
  return apiClient<FileInfoResponse>('/api/files', { method: 'POST', body });
}

// ---------- Comments ----------
/** GET /api/community/posts/{postId}/comments - 댓글 목록 */
export async function getComments(postId: number): Promise<CommunityCommentRes[]> {
  return apiClient<CommunityCommentRes[]>(`/api/community/posts/${postId}/comments`);
}

/** POST /api/community/posts/{postId}/comments - 댓글 작성 */
export async function createComment(
  postId: number,
  body: CommunityCommentCreateReq
): Promise<number> {
  return apiClient<number>(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    body,
  });
}

/** PUT /api/community/comments/{commentId} - 댓글 수정 */
export async function updateComment(
  commentId: number,
  body: CommunityCommentUpdateReq
): Promise<void> {
  return apiClient<void>(`/api/community/comments/${commentId}`, {
    method: 'PUT',
    body,
  });
}

/** DELETE /api/community/comments/{commentId} - 댓글 삭제 */
export async function deleteComment(commentId: number): Promise<void> {
  return apiClient<void>(`/api/community/comments/${commentId}`, { method: 'DELETE' });
}

/** POST /api/community/comments/{commentId}/like - 댓글 좋아요 */
export async function likeComment(commentId: number): Promise<void> {
  return apiClient<void>(`/api/community/comments/${commentId}/like`, { method: 'POST' });
}
