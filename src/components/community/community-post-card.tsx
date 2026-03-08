'use client';

import Image from 'next/image';
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

/** 제목 → 본문 한 줄 → 아이콘 + 숫자 + 시간 + 작성자 */
export function CommunityPostCard({ post, boardHref }: CommunityPostCardProps) {
  const bodyText = post.content?.trim() ?? '';
  const contentPreview = bodyText.slice(0, 80) + (bodyText.length > 80 ? '...' : '');

  const linkContent = (
    <>
      {/* 왼쪽: 제목·본문·메타 */}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-zinc-700 dark:text-zinc-300">
          {post.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs leading-snug font-normal text-zinc-500 dark:text-zinc-500">
          {contentPreview}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-zinc-500 dark:text-zinc-500">
          <span
            className="flex items-center gap-1 text-zinc-500 dark:text-zinc-500"
            aria-label={`좋아요 ${post.likeCount}개`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            {post.likeCount}
          </span>
          <span
            className="flex items-center gap-1 text-zinc-500 dark:text-zinc-500"
            aria-label={`저장 ${post.saveCount}개`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M4.5 3A2.25 2.25 0 002.25 5.25v14.25c0 1.08 1.176 1.75 2.25 1.75h15c1.074 0 2.25-.67 2.25-1.75V5.25A2.25 2.25 0 0019.5 3h-15z" />
            </svg>
            {post.saveCount}
          </span>
          <span
            className="flex items-center gap-1 text-zinc-500 dark:text-zinc-500"
            aria-label={`댓글 ${post.commentCount}개`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {post.commentCount}
          </span>
          <span className="text-zinc-500 dark:text-zinc-500">{formatDate(post.createdAt)}</span>
          <span className="text-zinc-500 dark:text-zinc-500">{post.authorName}</span>
        </div>
      </div>
      {/* 오른쪽: 썸네일 (사진 있을 때만 표시) */}
      {post.imageUrl ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      ) : null}
    </>
  );

  return (
    <article className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      {boardHref ? (
        <Link href={boardHref} className="flex min-w-0 flex-1 gap-3">
          {linkContent}
        </Link>
      ) : (
        linkContent
      )}
    </article>
  );
}
