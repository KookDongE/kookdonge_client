'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { getPostById } from '@/features/community/mock-data';
import type { BoardType } from '@/features/community/types';
import { PageCenteredSkeleton } from '@/components/common/skeletons';

const BOARD_LABEL: Record<BoardType, string> = {
  popular: '인기글',
  promo: '홍보글',
  free: '자유게시판',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type PageProps = { params: Promise<{ id: string }> };

export default function CommunityPostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const post = id > 0 ? getPostById(id) : null;

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (!profileLoading && profile && isSystemAdmin(profile) && (id <= 0 || !post)) {
      router.replace('/admin/community');
    }
  }, [id, post, profile, profileLoading, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile)) || (id > 0 && !post)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageCenteredSkeleton />
      </div>
    );
  }

  if (!post) return null;

  const boardLabel = BOARD_LABEL[post.boardType];

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-zinc-900">
      {/* 상단: 뒤로가기 (에타 스타일) */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-zinc-100 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <article className="px-4 py-4">
        {/* 작성자 · 게시판 · 시간 */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{post.authorName}</span>
          <span aria-hidden>·</span>
          <span>{boardLabel}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        {/* 제목 */}
        <h1 className="text-lg leading-snug font-bold text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h1>

        {/* 본문 */}
        <div className="mt-4 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
          {post.content}
        </div>

        {/* 액션 바: 공감(빨강) / 댓글(파랑) / 저장(노랑) + 숫자 (에타 스타일) */}
        <div className="mt-6 flex items-center gap-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="flex items-center gap-1.5 text-sm text-red-500" aria-label="공감">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={post.liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            공감 {post.likeCount}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-blue-500" aria-label="댓글">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            댓글 {post.commentCount}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-amber-500" aria-label="저장">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={post.saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.407 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
            저장 {post.saveCount}
          </span>
        </div>
      </article>

      {/* 댓글 영역 (에타 스타일, 플레이스홀더) */}
      <section className="mt-6 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          댓글 {post.commentCount}개
        </h2>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500">
          댓글 기능이 준비되면 여기에 표시됩니다.
        </div>
      </section>
    </div>
  );
}
