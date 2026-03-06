'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { isClubManager, isSystemAdmin } from '@/features/auth/permissions';
import type { CommunityPost } from '@/features/community/types';
import type { UserProfileRes } from '@/types/api';

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

/** 목 데이터: 현재 사용자 authorId (API 연동 시 profile 기반으로 교체) */
const MOCK_CURRENT_USER_ID = 1;

type CommunityPostCardProps = {
  post: CommunityPost;
  /** 게시판 목록 페이지 경로 (상세 없을 때 클릭 시 이동) */
  boardHref?: string;
  /** 삭제/신고 더보기 메뉴용 (없으면 더보기 비노출) */
  profile?: UserProfileRes | null;
};

/** 제목 → 본문 한 줄 → 아이콘 + 숫자 + 시간 + 작성자. boardHref 있을 때 더보기(삭제·신고) 노출 */
export function CommunityPostCard({ post, boardHref, profile }: CommunityPostCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const myAuthorId = MOCK_CURRENT_USER_ID;
  const isAdmin = profile ? isSystemAdmin(profile) : false;
  const isAuthor = post.authorId === myAuthorId;
  const isLeader =
    profile && post.clubId != null ? isClubManager(profile, post.clubId) : false;
  const canDelete = isAdmin || isAuthor || isLeader;
  const showMoreMenu = Boolean(boardHref && profile);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  const contentPreview = post.content.slice(0, 80) + (post.content.length > 80 ? '...' : '');

  const linkContent = (
    <>
      {/* 왼쪽: 제목·본문·메타 */}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
          {contentPreview}
        </p>
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
      </div>
      {/* 오른쪽: 썸네일 */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {post.title.slice(0, 1)}
          </div>
        )}
      </div>
    </>
  );

  const moreButton = showMoreMenu && (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label="더보기"
        aria-expanded={menuOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {menuOpen && (
        <div
          className="absolute top-full right-0 z-10 mt-1 min-w-[120px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          role="menu"
        >
          {canDelete && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                // TODO: 삭제 API 호출 후 목록 갱신
              }}
            >
              삭제
            </button>
          )}
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              router.push(`/mypage/settings/report?type=post&id=${post.id}`);
            }}
          >
            신고
          </button>
        </div>
      )}
    </div>
  );

  return (
    <article className="flex items-start gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      {boardHref ? (
        <>
          <Link href={boardHref} className="flex min-w-0 flex-1 gap-3">
            {linkContent}
          </Link>
          {moreButton}
        </>
      ) : (
        linkContent
      )}
    </article>
  );
}
