'use client';

import { use, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import {
  getCommentsByPostId,
  getPostById,
  type CommunityComment,
} from '@/features/community/mock-data';
import { PageCenteredSkeleton } from '@/components/common/skeletons';

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

function formatCommentTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 60000;
  if (diff < 1) return '방금 전';
  if (diff < 60) return `${Math.floor(diff)}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const emptySubscribe = () => () => {};

/** 하단 댓글 입력 바: app-container로 포탈해 main의 overflow-hidden에 의해 테두리가 잘리지 않도록 함 */
function CommentBarPortal({
  commentText,
  setCommentText,
  commentTextareaRef,
}: {
  commentText: string;
  setCommentText: (v: string) => void;
  commentTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  if (!isClient) return null;
  const container = document.querySelector('.app-container');
  if (!container) return null;

  const bar = (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 overflow-visible !bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:!bg-zinc-900">
      <div className="flex w-full items-end overflow-visible">
        <div className="comment-input-wrap relative flex min-w-0 flex-1 items-end overflow-visible rounded-lg border border-zinc-200 !bg-white pl-1 dark:border-zinc-700 dark:!bg-zinc-800">
          {commentText.trim().length === 0 && (
            <select
              className="shrink-0 rounded-l-md border-0 bg-transparent py-2.5 pr-6 pl-3 text-sm text-zinc-900 focus:ring-0 focus:outline-none dark:text-zinc-100"
              aria-label="댓글 작성 계정 선택"
              title="계정 선택"
            >
              <option value="me">내 계정</option>
            </select>
          )}
          <textarea
            ref={commentTextareaRef}
            placeholder="댓글을 입력하세요"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={1}
            className="max-h-[7.5rem] min-h-[2.4375rem] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-[0.5625rem] text-sm leading-normal text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="댓글 입력"
            style={{ height: 'auto' }}
          />
          <button
            type="button"
            className="shrink-0 rounded-full p-2 text-zinc-400 transition-opacity hover:opacity-80 dark:text-zinc-500"
            aria-label="댓글 등록"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(bar, container);
}

type PageProps = { params: Promise<{ id: string }> };

export default function CommunityPostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const post = id > 0 ? getPostById(id) : null;
  const comments: CommunityComment[] = post ? getCommentsByPostId(post.id) : [];

  /** 클릭 토글만 로컬 상태로 두고, 없으면 post 값 사용 (훅 규칙·effect setState 회피) */
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    const el = commentTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = 7.5 * 16; // 최대 5줄 (약 7.5rem)
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, [commentText]);

  if (profileLoading || (profile && !isSystemAdmin(profile)) || (id > 0 && !post)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageCenteredSkeleton />
      </div>
    );
  }

  if (!post) return null;

  const liked = likedOverride !== null ? likedOverride : (post.liked ?? false);
  const saved = savedOverride !== null ? savedOverride : (post.saved ?? false);

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-zinc-900">
      <article className="px-4 py-4">
        {/* 작성자: 프로필 사진 + 이름/시간 세로, 오른쪽 ... 메뉴(수정/삭제/신고) */}
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
            aria-hidden
          >
            {post.authorName.slice(0, 1)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{post.authorName}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="메뉴"
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
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  삭제
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  신고
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h1 className="text-lg leading-snug font-bold text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h1>

        {/* 본문 */}
        <div className="mt-4 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
          {post.content}
        </div>

        {/* 액션 바: 좋아요·저장 버튼(클릭 시 채움/비움 토글), 댓글은 표시만. 순서: 좋아요 → 저장 → 댓글 */}
        <div className="mt-6 flex items-center gap-6 pt-4">
          <button
            type="button"
            onClick={() =>
              setLikedOverride((prev) => (prev !== null ? !prev : !(post.liked ?? false)))
            }
            className={`flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80 ${
              liked ? 'text-red-500 dark:text-red-400' : 'text-red-400/80 dark:text-red-400/70'
            }`}
            aria-label={liked ? '공감 취소' : '공감'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
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
            {post.likeCount}
          </button>
          <button
            type="button"
            onClick={() =>
              setSavedOverride((prev) => (prev !== null ? !prev : !(post.saved ?? false)))
            }
            className={`flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80 ${
              saved
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-amber-400/80 dark:text-amber-400/70'
            }`}
            aria-label={saved ? '저장 취소' : '저장'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
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
            {post.saveCount}
          </button>
          <span
            className="flex items-center gap-1.5 text-sm text-sky-400/80 dark:text-sky-400/70"
            aria-label="댓글"
          >
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
            {post.commentCount}
          </span>
        </div>
      </article>

      {/* 댓글: 더미 데이터 */}
      <section className="mt-6 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          댓글 {comments.length}개
        </h2>
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            댓글이 없습니다.
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
                  aria-hidden
                >
                  {c.authorName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{c.authorName}</span>
                    <span>{formatCommentTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 하단 고정 댓글 입력창: 전송 버튼은 입력창 내부, 테두리 잘림 방지를 위해 포탈 사용 */}
      <CommentBarPortal
        commentText={commentText}
        setCommentText={setCommentText}
        commentTextareaRef={commentTextareaRef}
      />
    </div>
  );
}
