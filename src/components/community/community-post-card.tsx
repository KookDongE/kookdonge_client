'use client';

import Link from 'next/link';

import type { CommunityPost } from '@/features/community/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 1000) return '방금 전';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

type CommunityPostCardProps = {
  post: CommunityPost;
  /** 게시판 목록 페이지 경로 (상세 없을 때 클릭 시 이동) */
  boardHref?: string;
};

/** 제목 → 본문 한 줄 → 아이콘(빨강/파랑/노랑) + 숫자 + 시간 + 작성자 */
export function CommunityPostCard({ post, boardHref }: CommunityPostCardProps) {
  const contentPreview = post.content.slice(0, 80) + (post.content.length > 80 ? '...' : '');

  const cardContent = (
    <article className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      {/* 제목 */}
      <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-zinc-900 dark:text-zinc-100">
        {post.title}
      </h3>
      {/* 본문 한 줄 */}
      <p className="mt-1 line-clamp-1 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
        {contentPreview}
      </p>
      {/* 좋아요 / 댓글 / 저장 아이콘+숫자 (색상 있되 연하게) + 시간 + 작성자 */}
      <div className="mt-2 flex items-center gap-3 text-[12px] text-zinc-500 dark:text-zinc-500">
        <span
          className="flex items-center gap-1 text-red-400/80 dark:text-red-400/70"
          aria-label={`좋아요 ${post.likeCount}개`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={post.liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          {post.likeCount}
        </span>
        <span
          className="flex items-center gap-1 text-amber-400/80 dark:text-amber-400/70"
          aria-label={`저장 ${post.saveCount}개`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={post.saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.407 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
          {post.saveCount}
        </span>
        <span
          className="flex items-center gap-1 text-sky-400/80 dark:text-sky-400/70"
          aria-label={`댓글 ${post.commentCount}개`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
            />
          </svg>
          {post.commentCount}
        </span>
        <span className="text-zinc-500 dark:text-zinc-500">{formatDate(post.createdAt)}</span>
        <span className="text-zinc-500 dark:text-zinc-500">{post.authorName}</span>
      </div>
    </article>
  );

  if (boardHref) {
    return (
      <Link href={boardHref} className="block">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
}
