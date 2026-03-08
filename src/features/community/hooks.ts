'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CommunityPostCategory } from '@/types/api';

import * as communityApi from './api';
import {
  mapCommentResToComment,
  mapPostDetailResToPost,
  mapPostResToPost,
  type BoardType,
  type CommunityComment,
  type CommunityPost,
} from './types';

export const communityKeys = {
  all: ['community'] as const,
  posts: (params?: {
    category?: CommunityPostCategory;
    page?: number;
    size?: number;
    sort?: string;
  }) => [...communityKeys.all, 'posts', params] as const,
  postDetail: (postId: number) => [...communityKeys.all, 'post', postId] as const,
  comments: (postId: number) => [...communityKeys.all, 'comments', postId] as const,
  popular: (params?: { page?: number; size?: number; sort?: string }) =>
    [...communityKeys.all, 'popular', params] as const,
  search: (params: { keyword: string; page?: number; size?: number }) =>
    [...communityKeys.all, 'search', params] as const,
  myPosts: (params?: { page?: number; size?: number; sort?: string }) =>
    [...communityKeys.all, 'myPosts', params] as const,
  mySaved: (params?: { page?: number; size?: number; sort?: string }) =>
    [...communityKeys.all, 'mySaved', params] as const,
  myLiked: (params?: { page?: number; size?: number; sort?: string }) =>
    [...communityKeys.all, 'myLiked', params] as const,
  myCommented: (params?: { page?: number; size?: number; sort?: string }) =>
    [...communityKeys.all, 'myCommented', params] as const,
  managedClubs: () => [...communityKeys.all, 'managedClubs'] as const,
};

const sortParam = (sort: 'latest' | 'popular') =>
  sort === 'popular' ? 'likeCount,DESC' : 'createdAt,DESC';

/** 게시글 목록 (자유/홍보) - FREE | PROMOTION */
export function usePosts(params: {
  category?: CommunityPostCategory;
  page?: number;
  size?: number;
  sort?: 'latest' | 'popular';
}) {
  const { category, page = 0, size = 20, sort = 'latest' } = params;
  return useQuery({
    queryKey: communityKeys.posts({ category, page, size, sort: sortParam(sort) }),
    queryFn: () =>
      communityApi.getPosts({
        category,
        page,
        size,
        sort: sortParam(sort),
      }),
  });
}

/** 게시글 상세 */
export function usePostDetail(postId: number) {
  return useQuery({
    queryKey: communityKeys.postDetail(postId),
    queryFn: () => communityApi.getPost(postId),
    enabled: postId > 0,
  });
}

/** 게시글 상세 → UI CommunityPost (상세 페이지용) */
export function usePostDetailAsPost(postId: number): {
  data: CommunityPost | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const q = usePostDetail(postId);
  const data =
    q.data != null
      ? mapPostDetailResToPost(
          q.data,
          q.data.postCategory === 'PROMOTION' ? 'promo' : 'free'
        )
      : null;
  return {
    data,
    isLoading: q.isLoading,
    error: q.error as Error | null,
    refetch: q.refetch,
  };
}

/** 인기 게시글 목록 */
export function usePopularPosts(params?: {
  page?: number;
  size?: number;
  sort?: 'latest' | 'popular';
}) {
  const { page = 0, size = 20, sort = 'latest' } = params ?? {};
  return useQuery({
    queryKey: communityKeys.popular({ page, size, sort: sortParam(sort) }),
    queryFn: () =>
      communityApi.getPopularPosts({ page, size, sort: sortParam(sort) }),
  });
}

/** 게시글 검색 (query key / refetch용) */
function useSearchPostsQuery(keyword: string, sort: 'latest' | 'popular') {
  return useQuery({
    queryKey: communityKeys.search({ keyword, page: 0, size: 100 }),
    queryFn: () =>
      communityApi.searchPosts({
        keyword,
        page: 0,
        size: 100,
        sort: sortParam(sort),
      }),
    enabled: keyword.trim().length > 0,
  });
}

/** 내가 작성한 게시글 (CommunityPost[]) */
export function useMyPosts(params?: { sort?: 'latest' | 'popular' }): CommunityPost[] {
  const { sort = 'latest' } = params ?? {};
  const q = useQuery({
    queryKey: communityKeys.myPosts({ page: 0, size: 100, sort: sortParam(sort) }),
    queryFn: () =>
      communityApi.getMyPosts({ page: 0, size: 100, sort: sortParam(sort) }),
  });
  const raw = q.data?.content ?? [];
  return raw.map((r) => mapPostResToPost(r, 'free'));
}

/** 내가 저장한 게시글 (CommunityPost[]) */
export function useSavedPosts(params?: { sort?: 'latest' | 'popular' }): CommunityPost[] {
  const { sort = 'latest' } = params ?? {};
  const q = useQuery({
    queryKey: communityKeys.mySaved({ page: 0, size: 100, sort: sortParam(sort) }),
    queryFn: () =>
      communityApi.getMySavedPosts({ page: 0, size: 100, sort: sortParam(sort) }),
  });
  const raw = q.data?.content ?? [];
  return raw.map((r) => mapPostResToPost(r, 'free'));
}

/** 내가 좋아요한 게시글 (CommunityPost[]) */
export function useLikedPosts(params?: { sort?: 'latest' | 'popular' }): CommunityPost[] {
  const { sort = 'latest' } = params ?? {};
  const q = useQuery({
    queryKey: communityKeys.myLiked({ page: 0, size: 100, sort: sortParam(sort) }),
    queryFn: () =>
      communityApi.getMyLikedPosts({ page: 0, size: 100, sort: sortParam(sort) }),
  });
  const raw = q.data?.content ?? [];
  return raw.map((r) => mapPostResToPost(r, 'free'));
}

/** 내가 댓글 단 게시글 (CommunityPost[]) */
export function useCommentedPosts(params?: { sort?: 'latest' | 'popular' }): CommunityPost[] {
  const { sort = 'latest' } = params ?? {};
  const q = useQuery({
    queryKey: communityKeys.myCommented({ page: 0, size: 100, sort: sortParam(sort) }),
    queryFn: () =>
      communityApi.getMyCommentedPosts({ page: 0, size: 100, sort: sortParam(sort) }),
  });
  const raw = q.data?.content ?? [];
  return raw.map((r) => mapPostResToPost(r, 'free'));
}

/** 글쓰기 시 선택할 동아리 목록 (GET /api/community/posts/managed-clubs) */
export function useManagedClubsForPost() {
  return useQuery({
    queryKey: communityKeys.managedClubs(),
    queryFn: () => communityApi.getManagedClubsForPost(),
  });
}

/** 댓글 목록 */
export function useComments(postId: number) {
  return useQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: () => communityApi.getComments(postId),
    enabled: postId > 0,
  });
}

/** 댓글 목록 → UI CommunityComment[] */
export function useCommentsAsList(postId: number): {
  data: CommunityComment[];
  isLoading: boolean;
  refetch: () => void;
} {
  const q = useComments(postId);
  const data = (q.data ?? []).map(mapCommentResToComment);
  return {
    data,
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}

// ---------- Mutations ----------
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof communityApi.createPost>[0]) =>
      communityApi.createPost(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useUpdatePost(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof communityApi.updatePost>[1]) =>
      communityApi.updatePost(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useDeletePost(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useLikePost(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.likePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useSavePost(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.savePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useUnsavePost(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.unsavePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof communityApi.createComment>[1]) =>
      communityApi.createComment(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useUpdateComment(commentId: number, postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string }) =>
      communityApi.updateComment(commentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
    },
  });
}

export function useDeleteComment(commentId: number, postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
    },
  });
}

export function useLikeComment(commentId: number, postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => communityApi.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
    },
  });
}

/** 댓글 좋아요 (commentId를 인자로 전달) */
export function useLikeCommentMutation(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => communityApi.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
    },
  });
}

/** 댓글 삭제 (commentId를 인자로 전달) */
export function useDeleteCommentMutation(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => communityApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.postDetail(postId) });
    },
  });
}

// ---------- Legacy hook compat: 게시판별 목록을 CommunityPost[]로 반환 ----------
/** 자유/홍보/인기 게시판별 목록 (페이지에서 사용). sort 적용 후 UI 타입으로 반환 */
export function useBoardPosts(
  boardType: BoardType,
  _query: string,
  sort: 'latest' | 'popular'
): CommunityPost[] {
  const isPopular = boardType === 'popular';
  const category: CommunityPostCategory | undefined =
    boardType === 'free' ? 'FREE' : boardType === 'promo' ? 'PROMOTION' : undefined;

  const postsQuery = isPopular
    ? usePopularPosts({ page: 0, size: 100, sort })
    : usePosts({ category, page: 0, size: 100, sort });

  const raw = postsQuery.data?.content ?? [];
  const board: BoardType = isPopular ? 'popular' : boardType === 'promo' ? 'promo' : 'free';
  return raw.map((r) => mapPostResToPost(r, board));
}

/** 메인 커뮤니티 페이지: 인기/홍보/자유 각 섹션별 최대 5개 (API 연동) */
export function useCommunitySections(query: string, sort: 'latest' | 'popular') {
  const popular = usePopularPosts({ page: 0, size: 5, sort });
  const free = usePosts({ category: 'FREE', page: 0, size: 5, sort });
  const promo = usePosts({ category: 'PROMOTION', page: 0, size: 5, sort });

  return {
    popular: (popular.data?.content ?? []).map((r) => mapPostResToPost(r, 'popular')),
    free: (free.data?.content ?? []).map((r) => mapPostResToPost(r, 'free')),
    promo: (promo.data?.content ?? []).map((r) => mapPostResToPost(r, 'promo')),
  };
}

/** 검색 결과 (CommunityPost[]) */
export function useSearchPosts(
  keyword: string,
  sort: 'latest' | 'popular'
): CommunityPost[] {
  const q = useSearchPostsQuery(keyword, sort);
  const raw = q.data?.content ?? [];
  return raw.map((r) => mapPostResToPost(r, 'free'));
}
