'use client';

import { useMemo } from 'react';

import { filterByBoard, filterByQuery, getMockCommunityPosts, sortPosts } from './mock-data';
import type { BoardType, CommunityPost } from './types';

const SECTION_LIMIT = 5;

/** 메인 커뮤니티 페이지: 인기/홍보/자유 각 섹션별 최대 5개 (목 데이터) */
export function useCommunitySections(query: string, sort: 'latest' | 'popular') {
  const all = useMemo(() => getMockCommunityPosts(), []);
  const filtered = useMemo(() => filterByQuery(all, query), [all, query]);

  const popular = useMemo(
    () => sortPosts(filterByBoard(filtered, 'popular'), sort).slice(0, SECTION_LIMIT),
    [filtered, sort]
  );
  const promo = useMemo(
    () => sortPosts(filterByBoard(filtered, 'promo'), sort).slice(0, SECTION_LIMIT),
    [filtered, sort]
  );
  const free = useMemo(
    () => sortPosts(filterByBoard(filtered, 'free'), sort).slice(0, SECTION_LIMIT),
    [filtered, sort]
  );

  return { popular, promo, free };
}

/** 게시판별 전체 목록 (인기글/홍보글/자유게시판 페이지용) */
export function useBoardPosts(
  boardType: BoardType,
  query: string,
  sort: 'latest' | 'popular'
): CommunityPost[] {
  const all = useMemo(() => getMockCommunityPosts(), []);
  const byBoard = useMemo(() => filterByBoard(all, boardType), [all, boardType]);
  const filtered = useMemo(() => filterByQuery(byBoard, query), [byBoard, query]);
  return useMemo(() => sortPosts(filtered, sort), [filtered, sort]);
}

/** 내가 쓴 글 (목 데이터: authorId가 1인 글로 대체) */
export function useMyPosts(): CommunityPost[] {
  const all = useMemo(() => getMockCommunityPosts(), []);
  return useMemo(() => {
    const myId = 1; // TODO: 실제 로그인 사용자 ID
    return all
      .filter((p) => p.authorId === myId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [all]);
}

/** 댓글 단 글 (목 데이터: id % 3 === 0 등으로 대체) */
export function useCommentedPosts(): CommunityPost[] {
  const all = useMemo(() => getMockCommunityPosts(), []);
  return useMemo(() => {
    // TODO: 실제 API에서 "내가 댓글 단 글" 목록
    const commentedIds = new Set(all.filter((_, i) => i % 3 === 0).map((p) => p.id));
    return all
      .filter((p) => commentedIds.has(p.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [all]);
}

/** 좋아요 누른 글 (목 데이터: liked === true인 글) */
export function useLikedPosts(): CommunityPost[] {
  const all = useMemo(() => getMockCommunityPosts(), []);
  return useMemo(
    () =>
      all
        .filter((p) => p.liked)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [all]
  );
}

/** 저장 누른 글 (목 데이터: saved === true인 글) */
export function useSavedPosts(): CommunityPost[] {
  const all = useMemo(() => getMockCommunityPosts(), []);
  return useMemo(
    () =>
      all
        .filter((p) => p.saved)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [all]
  );
}

/** 전체 게시판 검색 결과 (검색 결과 페이지용) */
export function useSearchPosts(query: string, sort: 'latest' | 'popular'): CommunityPost[] {
  const all = useMemo(() => getMockCommunityPosts(), []);
  const filtered = useMemo(() => filterByQuery(all, query), [all, query]);
  return useMemo(() => sortPosts(filtered, sort), [filtered, sort]);
}
