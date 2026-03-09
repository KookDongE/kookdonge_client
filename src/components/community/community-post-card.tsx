'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { saveCommunityListScroll } from '@/features/community/hooks';
import type { CommunityPost } from '@/features/community/types';

/** 게시글 목록용: 년도·날짜·시간 표기 (올해면 MM.DD HH:mm, 올해 아니면 YY.MM.DD HH:mm) */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  const isCurrentYear = d.getFullYear() === now.getFullYear();
  if (isCurrentYear) return `${mm}.${dd} ${hh}:${min}`;
  const yy = d.getFullYear().toString().slice(-2);
  return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

type CommunityPostCardProps = {
  post: CommunityPost;
  /** 게시판 목록 페이지 경로 (상세 없을 때 클릭 시 이동) */
  boardHref?: string;
};

/** 제목 → 본문 한 줄 → 아이콘 + 숫자 + 시간 + 작성자 */
export function CommunityPostCard({ post, boardHref }: CommunityPostCardProps) {
  const pathname = usePathname();
  const bodyText = post.content?.trim() ?? '';
  const contentPreview = bodyText.slice(0, 80) + (bodyText.length > 80 ? '...' : '');
  const handleNavigate = () => {
    if (pathname) saveCommunityListScroll(pathname);
  };

  const categoryLabel =
    post.boardType === 'promo' ? '홍보' : post.boardType === 'popular' ? '인기' : '자유';

  const linkContent = (
    <>
      {/* 왼쪽: 제목·본문·메타 */}
      <div className="min-w-0 flex-1">
        <span
          className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-700/80 dark:text-zinc-400"
          aria-label={`게시판: ${categoryLabel}`}
        >
          {categoryLabel}
        </span>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-medium text-zinc-700 dark:text-zinc-300">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-xs leading-snug font-normal text-zinc-500 dark:text-zinc-500">
          {contentPreview}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-zinc-500 dark:text-zinc-500">
          {post.likeCount > 0 && (
            <span
              className="flex items-center gap-1 text-red-500 dark:text-red-400"
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
          )}
          {post.commentCount > 0 && (
            <span
              className="flex items-center gap-1 text-blue-500 dark:text-lime-400"
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
          )}
          {(post.likeCount > 0 || post.commentCount > 0) && (
            <span
              className="h-2 w-px shrink-0 self-center bg-zinc-300 dark:bg-zinc-600"
              aria-hidden
            />
          )}
          <span className="text-zinc-500 dark:text-zinc-500">{formatDate(post.createdAt)}</span>
          <span
            className="h-2 w-px shrink-0 self-center bg-zinc-300 dark:bg-zinc-600"
            aria-hidden
          />
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
            sizes="128px"
            quality={90}
          />
        </div>
      ) : null}
    </>
  );

  return (
    <article className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      {boardHref ? (
        <Link href={boardHref} className="flex min-w-0 flex-1 gap-3" onClick={handleNavigate}>
          {linkContent}
        </Link>
      ) : (
        linkContent
      )}
    </article>
  );
}
