'use client';

import { use, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { useQueries } from '@tanstack/react-query';
import { createPortal } from 'react-dom';

import { useMyProfile } from '@/features/auth/hooks';
import { isClubManager, isSystemAdmin } from '@/features/auth/permissions';
import {
  useCommentsAsList,
  useDeleteCommentMutation,
  useDeletePost,
  useLikeCommentMutation,
  useLikePost,
  usePostDetailAsPost,
  useSavePost,
  useUnsavePost,
  useCreateComment,
  useManagedClubsForPost,
} from '@/features/community/hooks';
import type { CommunityComment } from '@/features/community/types';
import { CommunityPostDetailSkeleton } from '@/components/common/skeletons';
import type { CommunityAuthorType } from '@/types/api';
import { clubApi, clubKeys } from '@/features/club';

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

const SWIPE_THRESHOLD = 50;

/** 이미지 확대 라이트박스: 가로 스와이프·좌우 버튼으로 이전/다음 이미지 */
function ImageLightbox({
  imageUrls,
  currentIndex,
  onIndexChange,
  onClose,
}: {
  imageUrls: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const touchStartX = useRef<number | null>(null);

  const goPrev = () => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  };
  const goNext = () => {
    if (currentIndex < imageUrls.length - 1) onIndexChange(currentIndex + 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].clientX;
    const delta = touchStartX.current - endX;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD) goNext();
    else if (delta < -SWIPE_THRESHOLD) goPrev();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="사진 확대"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between px-1 py-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-sm text-white/90" aria-live="polite">
          {currentIndex + 1}/{imageUrls.length}
        </span>
        <div className="w-9" aria-hidden />
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center gap-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={imageUrls[currentIndex]}
          alt=""
          className="max-h-full max-w-full select-none object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

/** 댓글 계정 선택 옵션: 익명, 내이름, 내가 관리중인 동아리 (글쓰기와 동일) */
type CommentAccountOption = { key: string; label: string };

/** 하단 댓글 입력 바: app-container로 포탈해 main의 overflow-hidden에 의해 테두리가 잘리지 않도록 함 */
function CommentBarPortal({
  commentText,
  setCommentText,
  commentTextareaRef,
  commentAccountKey,
  setCommentAccountKey,
  commentAccountOptions,
  replyingTo,
  onClearReply,
  onSubmitComment,
  isCommentSubmitting,
}: {
  commentText: string;
  setCommentText: (v: string) => void;
  commentTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  commentAccountKey: string;
  setCommentAccountKey: (v: string) => void;
  commentAccountOptions: CommentAccountOption[];
  replyingTo: { commentId: number; authorName: string } | null;
  onClearReply: () => void;
  onSubmitComment: () => void;
  isCommentSubmitting: boolean;
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
      {replyingTo && (
        <div className="mb-1 flex items-center justify-between gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <span>{replyingTo.authorName}에게 답글 작성</span>
          <button
            type="button"
            onClick={onClearReply}
            className="rounded p-0.5 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            aria-label="답글 취소"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex w-full items-end overflow-visible">
        <div className="comment-input-wrap relative flex min-w-0 flex-1 items-end overflow-visible rounded-lg border border-zinc-200 bg-white pl-1 dark:border-zinc-700 dark:bg-zinc-800">
          {commentText.trim().length === 0 && (
            <select
              className="shrink-0 rounded-l-md border-0 bg-transparent py-2.5 pr-6 pl-3 text-sm text-zinc-900 focus:ring-0 focus:outline-none dark:text-zinc-100"
              aria-label="댓글 작성 계정 선택"
              title="계정 선택"
              value={commentAccountKey}
              onChange={(e) => setCommentAccountKey(e.target.value)}
            >
              {commentAccountOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          <textarea
            ref={commentTextareaRef}
            placeholder={replyingTo ? `${replyingTo.authorName}에게 답글을 입력하세요` : '댓글을 입력하세요'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={1}
            className="max-h-[7.5rem] min-h-[2.4375rem] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-[0.5625rem] text-sm leading-normal text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label={replyingTo ? '답글 입력' : '댓글 입력'}
            style={{ height: 'auto' }}
          />
          <button
            type="button"
            onClick={onSubmitComment}
            disabled={!commentText.trim() || isCommentSubmitting}
            className="shrink-0 rounded-full p-2 text-zinc-500 transition-opacity hover:opacity-80 dark:text-zinc-400 disabled:opacity-50"
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
  const { data: managedClubs = [] } = useManagedClubsForPost();
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const { data: post, isLoading: postLoading, refetch: refetchPost } = usePostDetailAsPost(id);
  const { data: comments, refetch: refetchComments } = useCommentsAsList(id);

  const commentAccountOptions: CommentAccountOption[] = [
    { key: 'anonymous', label: '익명' },
    { key: 'me', label: profile?.name ?? '내이름' },
    ...managedClubs.map((c) => ({ key: `club-${c.clubId}`, label: c.clubName })),
  ];

  /** 클릭 토글만 로컬 상태로 두고, 없으면 post 값 사용 (훅 규칙·effect setState 회피) */
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');
  const [commentAccountKey, setCommentAccountKey] = useState('me');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  /** 댓글별 ... 메뉴 열린 id (null이면 닫힘) */
  const [commentMenuOpenId, setCommentMenuOpenId] = useState<number | null>(null);
  const commentMenuRef = useRef<HTMLDivElement>(null);
  /** 삭제 불가 토스트 "본인이 작성한 게 아니라면 삭제할 수 없습니다" */
  const [deleteDeniedToast, setDeleteDeniedToast] = useState(false);
  /** 게시글 삭제 중: 빈 화면 표시 후 API 호출·이전 페이지 이동 */
  const [isDeleting, setIsDeleting] = useState(false);
  /** 댓글별 좋아요 수 로컬 오버라이드 (id -> count) */
  const [commentLikeOverrides, setCommentLikeOverrides] = useState<Record<number, number>>({});
  /** 댓글별 좋아요 클릭(하트) 토글 */
  const [commentLikedByMe, setCommentLikedByMe] = useState<Record<number, boolean>>({});
  /** 첨부 사진 확대 보기 (인덱스 또는 null) */
  /** 답글 작성 중인 댓글 (commentId, authorName) */
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const replyingTo =
    replyingToCommentId != null
      ? (() => {
          const c = comments.find((x) => x.id === replyingToCommentId);
          return c ? { commentId: c.id, authorName: c.authorName } : null;
        })()
      : null;
  const isAdmin = profile ? isSystemAdmin(profile) : false;
  const isAuthor = post?.mine ?? false;
  const isLeader =
    profile && post?.clubId != null ? isClubManager(profile, post.clubId) : false;
  const canDelete = isAdmin || isAuthor || isLeader;
  const canEdit = isAdmin;

  const likePostMutation = useLikePost(id);
  const savePostMutation = useSavePost(id);
  const unsavePostMutation = useUnsavePost(id);
  const deletePostMutation = useDeletePost(id);
  const createCommentMutation = useCreateComment(id);
  const likeCommentMutation = useLikeCommentMutation(id);
  const deleteCommentMutation = useDeleteCommentMutation(id);

  /** 게시글·댓글에 등장하는 동아리 ID 목록 (중복 제거) */
  const uniqueClubIds = useMemo(() => {
    const ids = new Set<number>();
    if (post?.clubId != null) ids.add(post.clubId);
    (comments ?? []).forEach((c) => {
      if (c.clubId != null) ids.add(c.clubId);
      (c.replies ?? []).forEach((r) => {
        if (r.clubId != null) ids.add(r.clubId);
      });
    });
    return Array.from(ids);
  }, [post?.clubId, comments]);

  const clubDetailQueries = useQueries({
    queries: uniqueClubIds.map((clubId) => ({
      queryKey: clubKeys.detail(clubId),
      queryFn: () => clubApi.getClubDetail(clubId),
    })),
  });

  /** 동아리 ID → 프로필 이미지 URL (게시글/댓글 작성자 아바타용) */
  const clubImageMap = useMemo(() => {
    const map: Record<number, string> = {};
    clubDetailQueries.forEach((q, i) => {
      const clubId = uniqueClubIds[i];
      if (clubId != null && q.data?.image) map[clubId] = q.data.image;
    });
    return map;
  }, [uniqueClubIds, clubDetailQueries]);

  useEffect(() => {
    if (profileLoading || postLoading) return;
    if (id <= 0 || (id > 0 && !post)) {
      router.replace('/community');
    }
  }, [id, post, profileLoading, postLoading, router]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (commentMenuOpenId === null) return;
    const handleClick = (e: MouseEvent) => {
      if (commentMenuRef.current && !commentMenuRef.current.contains(e.target as Node)) {
        setCommentMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [commentMenuOpenId]);

  useEffect(() => {
    if (!deleteDeniedToast) return;
    const t = setTimeout(() => setDeleteDeniedToast(false), 2500);
    return () => clearTimeout(t);
  }, [deleteDeniedToast]);

  useEffect(() => {
    const el = commentTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = 7.5 * 16; // 최대 5줄 (약 7.5rem)
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, [commentText]);

  if (profileLoading || postLoading || (id > 0 && !post)) {
    return <CommunityPostDetailSkeleton />;
  }

  if (!post) return null;

  const handleLike = () => {
    const currentLiked = likedOverride !== null ? likedOverride : (post.liked ?? false);
    if (currentLiked) return; // 한 번 좋아요하면 취소 불가
    setLikedOverride(true);
    likePostMutation.mutate(undefined, {
      onError: () => setLikedOverride(null),
    });
  };
  const handleSave = () => {
    setSavedOverride((prev) => (prev !== null ? !prev : !(post.saved ?? false)));
    (post.saved ? unsavePostMutation : savePostMutation).mutate(undefined, {
      onError: () =>
        setSavedOverride((prev) => (prev !== null ? !prev : !(post.saved ?? false))),
    });
  };
  const handleDeletePost = () => {
    setMenuOpen(false);
    setIsDeleting(true);
    deletePostMutation.mutate(undefined, {
      onSuccess: () => router.back(),
      onError: () => setIsDeleting(false),
    });
  };
  const resolveAuthorTypeAndClubId = (
    key: string
  ): { authorType: CommunityAuthorType; clubId?: number } => {
    if (key === 'anonymous') return { authorType: 'ANONYMOUS' };
    if (key === 'me') return { authorType: 'USER' };
    if (key.startsWith('club-')) {
      const clubId = Number(key.replace('club-', ''));
      return { authorType: 'CLUB', clubId: Number.isNaN(clubId) ? undefined : clubId };
    }
    return { authorType: 'USER' };
  };
  const handleSubmitComment = () => {
    const content = commentText.trim();
    if (!content) return;
    const { authorType, clubId } = resolveAuthorTypeAndClubId(commentAccountKey);
    createCommentMutation.mutate(
      { authorType, content, parentCommentId: replyingToCommentId ?? undefined, clubId },
      {
        onSuccess: () => {
          setCommentText('');
          setReplyingToCommentId(null);
          refetchComments();
          refetchPost();
        },
      }
    );
  };

  const liked = likedOverride !== null ? likedOverride : (post.liked ?? false);
  const saved = savedOverride !== null ? savedOverride : (post.saved ?? false);

  if (isDeleting) {
    return <div className="min-h-screen bg-white dark:bg-zinc-900" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-zinc-900">
      <article className="px-4 py-4">
        {/* 작성자: 프로필 사진 + 이름/시간 세로, 오른쪽 ... 메뉴(수정/삭제/신고) */}
        <div className="mb-4 flex items-center gap-4">
          {post.clubId != null && (
            <div
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
              aria-hidden
            >
              {clubImageMap[post.clubId] ? (
                <img
                  src={clubImageMap[post.clubId]}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center">
                  {post.authorName.slice(0, 1)}
                </span>
              )}
            </div>
          )}
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
                {canEdit && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/community/posts/${post.id}/edit`);
                    }}
                  >
                    수정
                  </button>
                )}
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    if (isAuthor) {
                      alert('본인은 신고할 수 없습니다.');
                      return;
                    }
                    router.push(
                      `/mypage/settings/report?type=post&id=${post.id}`
                    );
                  }}
                >
                  신고
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    role="menuitem"
                    onClick={handleDeletePost}
                  >
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h1 className="text-base leading-snug font-medium text-zinc-700 dark:text-zinc-300">
          {post.title}
        </h1>

        {/* 본문 */}
        <div className="mt-4 text-sm leading-relaxed break-words whitespace-pre-wrap font-normal text-zinc-600 dark:text-zinc-400">
          {post.content}
        </div>

        {/* 첨부 사진: 단일이면 원본 비율, 여러 장이면 가로 슬라이드 4:3. 클릭 시 확대 미리보기 */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          post.imageUrls.length === 1 ? (
            <button
              type="button"
              onClick={() => setExpandedImageIndex(0)}
              className="mt-4 block w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 aspect-[9/16]"
              aria-label="사진 확대 보기"
            >
              <img
                src={post.imageUrls[0]}
                alt=""
                className="size-full object-cover"
              />
            </button>
          ) : (
            <div className="no-scrollbar -mx-4 mt-4 overflow-x-auto overflow-y-hidden px-4">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {post.imageUrls.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setExpandedImageIndex(idx)}
                    className="relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                    aria-label={`사진 ${idx + 1} 확대 보기`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* 액션 바: 좋아요·저장 버튼(클릭 시 채움/비움 토글), 댓글은 표시만. 순서: 좋아요 → 저장 → 댓글 */}
        <div className="mt-6 flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={likePostMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-red-400/80 transition-opacity hover:opacity-80 dark:text-red-400/70 disabled:opacity-50"
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
            onClick={handleSave}
            disabled={savePostMutation.isPending || unsavePostMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-amber-400/80 transition-opacity hover:opacity-80 dark:text-amber-400/70 disabled:opacity-50"
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
            className="invisible flex items-center gap-1.5 text-sm text-sky-400/80 dark:text-sky-400/70"
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

      {/* 첨부 사진 확대 보기 오버레이 (가로 스와이프·좌우 버튼으로 이전/다음) */}
      {post.imageUrls && expandedImageIndex !== null && (
        <ImageLightbox
          imageUrls={post.imageUrls}
          currentIndex={expandedImageIndex}
          onIndexChange={setExpandedImageIndex}
          onClose={() => setExpandedImageIndex(null)}
        />
      )}

      {/* 댓글 */}
      <section className="mt-6 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          댓글{' '}
          {comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)}개
        </h2>
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            댓글이 없습니다.
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.flatMap((c) => [
              { comment: c, isReply: false as const, parentAuthor: undefined },
              ...(c.replies ?? []).map((r) => ({
                comment: r,
                isReply: true as const,
                parentAuthor: c.authorName,
              })),
            ]).map(({ comment: c, isReply, parentAuthor }) => {
              const likeCount = commentLikeOverrides[c.id] ?? c.likeCount;
              const liked = commentLikedByMe[c.id] ?? (c.liked ?? false);
              const isMine = c.mine ?? false;
              return (
                <li
                  key={c.id}
                  className={`flex gap-3 ${isReply ? 'pl-6 sm:pl-8' : ''}`}
                >
                  {c.clubId != null && (
                    <div
                      className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
                      aria-hidden
                    >
                      {clubImageMap[c.clubId] ? (
                        <img
                          src={clubImageMap[c.clubId]}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center">
                          {c.authorName.slice(0, 1)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className={`min-w-0 flex-1 ${isReply ? 'rounded-r border-l-2 border-zinc-100 pl-3 dark:border-zinc-800' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{c.authorName}</span>
                        {isReply && parentAuthor && (
                          <span className="text-zinc-400 dark:text-zinc-500">
                            · {parentAuthor}님에게 답글
                          </span>
                        )}
                        <span>{formatCommentTime(c.createdAt)}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          className="flex items-center gap-0.5 rounded p-1 transition-opacity hover:opacity-80 text-red-400/80 dark:text-red-400/70"
                          aria-label={`좋아요 ${likeCount}개`}
                          onClick={() => {
                            if (liked) return; // 한 번 좋아요하면 취소 불가
                            setCommentLikedByMe((prev) => ({ ...prev, [c.id]: true }));
                            setCommentLikeOverrides((prev) => ({
                              ...prev,
                              [c.id]: (prev[c.id] ?? c.likeCount) + 1,
                            }));
                            likeCommentMutation.mutate(c.id, {
                              onError: () => {
                                setCommentLikedByMe((prev) => ({ ...prev, [c.id]: false }));
                                setCommentLikeOverrides((prev) => ({
                                  ...prev,
                                  [c.id]: (prev[c.id] ?? c.likeCount) - 1,
                                }));
                              },
                            });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={liked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={1.5}
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                          <span className="text-xs">{likeCount}</span>
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-sky-400/80 transition-colors hover:text-sky-400 dark:text-sky-400/70 dark:hover:text-sky-400"
                          aria-label="답글"
                          onClick={() => {
                            setReplyingToCommentId(c.id);
                            requestAnimationFrame(() => {
                              commentTextareaRef.current?.focus();
                            });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                            />
                          </svg>
                        </button>
                        <div
                          className="relative"
                          ref={commentMenuOpenId === c.id ? commentMenuRef : undefined}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCommentMenuOpenId((prev) => (prev === c.id ? null : c.id))
                            }
                            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            aria-label="더보기"
                            aria-expanded={commentMenuOpenId === c.id}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {commentMenuOpenId === c.id && (
                            <div
                              className="action-menu-dropdown absolute right-0 top-full z-10 mt-0.5 min-w-[100px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                              role="menu"
                            >
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                role="menuitem"
                                onClick={() => {
                                  setCommentMenuOpenId(null);
                                  if (isMine) {
                                    alert('본인은 신고할 수 없습니다.');
                                    return;
                                  }
                                  router.push(`/mypage/settings/report?type=comment&id=${c.id}`);
                                }}
                              >
                                신고
                              </button>
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                role="menuitem"
                                onClick={() => {
                                  setCommentMenuOpenId(null);
                                  if (isMine) {
                                    deleteCommentMutation.mutate(c.id, {
                                      onSuccess: () => refetchComments(),
                                    });
                                  } else {
                                    setDeleteDeniedToast(true);
                                  }
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-0.5 text-sm font-normal text-zinc-600 dark:text-zinc-400">{c.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 삭제 불가 토스트: 본인 댓글이 아닐 때 */}
      {deleteDeniedToast && (
        <div
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-zinc-700"
          role="alert"
        >
          본인이 작성한 게 아니라면 삭제할 수 없습니다.
        </div>
      )}

      {/* 하단 고정 댓글 입력창: 전송 버튼은 입력창 내부, 테두리 잘림 방지를 위해 포탈 사용 */}
      <CommentBarPortal
        commentText={commentText}
        setCommentText={setCommentText}
        commentTextareaRef={commentTextareaRef}
        commentAccountKey={commentAccountKey}
        setCommentAccountKey={setCommentAccountKey}
        commentAccountOptions={commentAccountOptions}
        replyingTo={replyingTo}
        onClearReply={() => setReplyingToCommentId(null)}
        onSubmitComment={handleSubmitComment}
        isCommentSubmitting={createCommentMutation.isPending}
      />
    </div>
  );
}
