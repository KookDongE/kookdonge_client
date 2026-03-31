'use client';

import { use, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Spinner } from '@heroui/react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';

import type { CommunityAuthorType } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { useLoginRequiredModalStore } from '@/features/auth/login-required-modal-store';
import { isClubManager, isSystemAdmin } from '@/features/auth/permissions';
import { useAuthStore } from '@/features/auth/store';
import { clubApi, clubKeys } from '@/features/club';
import {
  communityKeys,
  useCommentsAsList,
  useCreateComment,
  useDeleteCommentMutation,
  useDeletePost,
  useLikeCommentMutation,
  useLikePost,
  useManagedClubsForPost,
  usePostDetailAsPost,
  useSavePost,
  useUnsavePost,
} from '@/features/community/hooks';
import { CommunityPostDetailSkeleton } from '@/components/common/skeletons';
import { PersonFillIcon } from '@/components/icons/person-fill-icon';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const isCurrentYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString('ko-KR', {
    year: isCurrentYear ? undefined : '2-digit',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** 댓글 작성 시각 표기용: 올해면 MM.DD HH:mm, 올해 아니면 26.03.09 02:59 */
function formatCommentWrittenAt(iso: string): string {
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

/** 물음표 뒤에서 줄바꿈되지 않도록 Zero-Width Word Joiner(U+2060) 삽입 */
function preventBreakAfterQuestion(text: string): string {
  return text.replace(/\?/g, '?\u2060');
}

/** PWA/앱 뷰(standalone) 여부. 앱 뷰에서만 답글 행 여백을 넓혀 웹과 동일한 시인성 유지 */
function isAppView(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || fullscreen || iosStandalone;
}

const SWIPE_THRESHOLD = 50;

/** 상세조회 전용 배너 풀 (public/banner의 detail1, 2, 3 중 랜덤 1장) */
const DETAIL_VIEW_BANNERS = [
  '/banner/detail1.png',
  '/banner/detail2.png',
  '/banner/detail3.png',
] as const;

/** 액션 바 ~ 댓글 사이 배너 (상세조회 전용, 풀에서 랜덤 1장) */
function PostDetailBanner() {
  const [src] = useState(
    () => DETAIL_VIEW_BANNERS[Math.floor(Math.random() * DETAIL_VIEW_BANNERS.length)]
  );
  return (
    <div
      className="relative -mt-4 aspect-[1855/380] w-full shrink-0 overflow-hidden border-0 bg-zinc-100 outline-none dark:bg-zinc-800/50"
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-cover outline-none"
        sizes="(max-width: 448px) 100vw, 448px"
      />
    </div>
  );
}

/** 이미지 확대 라이트박스: 첫 열 때 로딩 후 표시, 넘길 땐 프리로드로 로딩 없음, 로딩 중 스피너 */
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
  /** 로드 완료된 이미지 인덱스 (첫 열기 시 스피너, 넘길 때 이미 로드됐으면 스피너 없음) */
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set());

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

  const markLoaded = (index: number) => {
    setLoadedIndices((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  };

  const currentLoaded = loadedIndices.has(currentIndex);
  const prevIndex = currentIndex - 1;
  const nextIndex = currentIndex + 1;

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
        {/* 인접 이미지 프리로드 (넘길 때 로딩 없이 바로 표시) */}
        {prevIndex >= 0 && (
          // eslint-disable-next-line @next/next/no-img-element -- 프리로드용
          <img
            src={imageUrls[prevIndex]}
            alt=""
            className="hidden"
            loading="eager"
            onLoad={() => markLoaded(prevIndex)}
          />
        )}
        {nextIndex < imageUrls.length && (
          // eslint-disable-next-line @next/next/no-img-element -- 프리로드용
          <img
            src={imageUrls[nextIndex]}
            alt=""
            className="hidden"
            loading="eager"
            onLoad={() => markLoaded(nextIndex)}
          />
        )}

        {/* 현재 이미지: 로드 전엔 스피너, 로드 후 표시 */}
        {!currentLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white" aria-hidden>
            <Spinner size="lg" color="current" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- 라이트박스 동적 URL, 클릭/터치 제스처 */}
        <img
          key={currentIndex}
          src={imageUrls[currentIndex]}
          alt=""
          className="max-h-full max-w-full object-contain select-none"
          style={{ visibility: currentLoaded ? 'visible' : 'hidden' }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          onLoad={() => markLoaded(currentIndex)}
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
  canWrite,
  onRequireAuth,
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
  canWrite: boolean;
  onRequireAuth: () => void;
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
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md overflow-visible !bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:!bg-zinc-900">
      {replyingTo && (
        <div className="mb-1 flex items-center justify-between gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <span>{replyingTo.authorName}에게 답글 작성</span>
          <button
            type="button"
            onClick={onClearReply}
            className="rounded p-0.5 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            aria-label="답글 취소"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex w-full items-end overflow-visible">
        <div className="comment-input-wrap relative flex min-w-0 flex-1 items-end overflow-visible rounded-lg border border-zinc-200 bg-white before:pointer-events-none before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:rounded-l-lg before:bg-zinc-200 before:content-[''] dark:border-zinc-700 dark:bg-zinc-800 dark:before:bg-zinc-700">
          {canWrite && commentText.trim().length === 0 && (
            <select
              className="shrink-0 rounded-l-md border-0 bg-transparent py-2.5 pr-4 pl-3 text-sm text-zinc-900 focus:ring-0 focus:outline-none dark:text-zinc-100"
              aria-label="댓글 작성 계정 선택"
              title="계정 선택"
              value={commentAccountKey}
              onChange={(e) => setCommentAccountKey(e.target.value)}
              disabled={!canWrite || isCommentSubmitting}
              onClick={() => {
                if (!canWrite) onRequireAuth();
              }}
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
            placeholder={
              !canWrite
                ? '로그인하여 댓글을 입력하세요'
                : replyingTo
                  ? `${replyingTo.authorName}에게 답글을 입력하세요`
                  : '댓글을 입력하세요'
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onFocus={() => {
              if (!canWrite) onRequireAuth();
            }}
            onClick={() => {
              if (!canWrite) onRequireAuth();
            }}
            rows={1}
            className="max-h-[7.5rem] min-h-[2.4375rem] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-[0.5625rem] text-sm leading-normal text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label={replyingTo ? '답글 입력' : '댓글 입력'}
            style={{ height: 'auto' }}
            disabled={!canWrite || isCommentSubmitting}
          />
          <button
            type="button"
            onClick={onSubmitComment}
            disabled={!canWrite || !commentText.trim() || isCommentSubmitting}
            className="comment-send-btn shrink-0 rounded-full !bg-white p-2 text-zinc-600 transition-opacity hover:opacity-80 disabled:opacity-50 dark:!bg-zinc-800 dark:text-zinc-400"
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
              className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const openLoginModal = useLoginRequiredModalStore((s) => s.open);
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: managedClubs = [] } = useManagedClubsForPost();
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const { data: post, isLoading: postLoading, refetch: refetchPost } = usePostDetailAsPost(id);
  const { data: comments, refetch: refetchComments } = useCommentsAsList(id);
  const _scrollToCommentId = searchParams.get('commentId');
  const hasScrolledToComment = useRef(false);

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
  const replyRowIsAppView = useSyncExternalStore(
    emptySubscribe,
    () => isAppView(),
    () => false
  );
  const replyingTo =
    replyingToCommentId != null
      ? (() => {
          const c = comments.find((x) => x.id === replyingToCommentId);
          return c ? { commentId: c.id, authorName: c.authorName } : null;
        })()
      : null;
  const isAdmin = profile ? isSystemAdmin(profile) : false;
  const isAuthor = post?.mine ?? false;
  const isLeader = profile && post?.clubId != null ? isClubManager(profile, post.clubId) : false;
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
  }, [post, comments]);

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

  /** 알림에서 진입 시 commentId 쿼리 있으면 해당 댓글/답글으로 스크롤 */
  useEffect(() => {
    const commentId = searchParams.get('commentId');
    if (!commentId || hasScrolledToComment.current || !comments.length) return;
    const targetId = parseInt(commentId, 10);
    if (!Number.isInteger(targetId)) return;
    const rafId = requestAnimationFrame(() => {
      hasScrolledToComment.current = true;
      const el = document.querySelector(`[data-comment-id="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const q = new URLSearchParams(searchParams.toString());
        q.delete('commentId');
        const next = q.toString() ? `?${q.toString()}` : '';
        router.replace(`${window.location.pathname}${next}`, { scroll: false });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [searchParams, comments.length, router]);

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

  const returnPath =
    (pathname ?? '') + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
  const requireAuthOrOpenModal = () => {
    if (accessToken) return true;
    openLoginModal(returnPath || '/community');
    return false;
  };

  const handleLike = () => {
    if (!requireAuthOrOpenModal()) return;
    const currentLiked = likedOverride !== null ? likedOverride : (post.liked ?? false);
    if (currentLiked) return; // 한 번 좋아요하면 취소 불가
    if (!confirm('좋아요를 누르시겠습니까?')) return;
    setLikedOverride(true);
    likePostMutation.mutate(undefined, {
      onError: () => setLikedOverride(null),
    });
  };
  const handleSave = () => {
    if (!requireAuthOrOpenModal()) return;
    setSavedOverride((prev) => (prev !== null ? !prev : !(post.saved ?? false)));
    (post.saved ? unsavePostMutation : savePostMutation).mutate(undefined, {
      onError: () => setSavedOverride((prev) => (prev !== null ? !prev : !(post.saved ?? false))),
    });
  };
  const handleDeletePost = () => {
    setMenuOpen(false);
    setIsDeleting(true);
    deletePostMutation.mutate(undefined, {
      onSuccess: () => {
        // 먼저 이탈해야 상세 useQuery가 refetch하지 않음 (refetch 시 404 → 토스트)
        router.back();
        setTimeout(() => {
          queryClient.removeQueries({ queryKey: communityKeys.postDetail(id) });
          queryClient.removeQueries({ queryKey: communityKeys.comments(id) });
          queryClient.invalidateQueries({ queryKey: communityKeys.all });
        }, 150);
      },
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
    if (!requireAuthOrOpenModal()) return;
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
        <div className="mb-4 flex items-center gap-2">
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
            aria-hidden
          >
            {post.clubId != null && clubImageMap[post.clubId] ? (
              /* eslint-disable-next-line @next/next/no-img-element -- 동아리 로고 외부 URL */
              <img src={clubImageMap[post.clubId]} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center">
                <PersonFillIcon className="h-[1.75rem] w-[1.75rem] shrink-0 text-zinc-500 dark:text-zinc-500" />
              </span>
            )}
          </div>
          <div className="flex min-w-0 shrink-0 flex-col gap-0 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center">
              {post.clubId != null ? (
                <button
                  type="button"
                  onClick={() => router.push(`/clubs/${post.clubId}`)}
                  className="flex items-center gap-1 rounded-full py-0.5 pr-0.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  aria-label="동아리 상세 보기"
                >
                  <span className="min-w-0 truncate">{post.authorName}</span>
                </button>
              ) : (
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {post.authorName}
                </span>
              )}
            </div>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="relative ml-auto shrink-0" ref={menuRef}>
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
                className="absolute top-full right-0 z-10 mt-1 min-w-[120px] rounded-lg border border-zinc-200 bg-white py-1 dark:border-zinc-700 dark:bg-zinc-800"
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
                    router.push(`/mypage/settings/report?type=post&id=${post.id}`);
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
        <div className="mt-4 text-sm leading-relaxed font-normal break-words whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {post.content}
        </div>

        {/* 첨부 사진: 단일이면 원본 비율, 여러 장이면 가로 슬라이드 1:1. 클릭 시 확대 미리보기 */}
        {post.imageUrls &&
          post.imageUrls.length > 0 &&
          (post.imageUrls.length === 1 ? (
            <button
              type="button"
              onClick={() => setExpandedImageIndex(0)}
              className="mt-4 block w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
              aria-label="사진 확대 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 게시글 첨부 이미지 동적 URL */}
              <img
                src={post.imageUrls[0]}
                alt=""
                className="h-auto w-full max-w-full object-contain"
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
                    className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                    aria-label={`사진 ${idx + 1} 확대 보기`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 게시글 첨부 이미지 동적 URL */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}

        {/* 액션 바: 공감 | 댓글 N | 스크랩 (가로 3등분) */}
        <div className="-mx-4 mt-6 flex items-center border-t border-zinc-200 px-4 py-5 dark:border-zinc-700">
          <button
            type="button"
            onClick={handleLike}
            disabled={likePostMutation.isPending}
            className={`flex flex-1 items-center justify-center gap-1.5 text-sm transition-none hover:opacity-80 disabled:opacity-50 ${liked ? 'text-red-500/90 dark:text-red-500/85' : 'text-zinc-500 dark:text-zinc-500'}`}
            aria-label={liked ? '공감 취소' : '공감'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span>공감</span>
            <span>{post.likeCount}</span>
          </button>
          <span
            className="flex flex-1 items-center justify-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-500"
            aria-label="댓글"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <span>댓글 {post.commentCount}</span>
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={savePostMutation.isPending || unsavePostMutation.isPending}
            className={`flex flex-1 items-center justify-center gap-1.5 text-sm transition-none hover:opacity-80 disabled:opacity-50 ${saved ? 'text-amber-500/90 dark:text-amber-500/85' : 'text-zinc-500 dark:text-zinc-500'}`}
            aria-label={saved ? '저장 취소' : '스크랩'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                clipRule="evenodd"
              />
            </svg>
            <span>스크랩</span>
            <span>{post.saveCount}</span>
          </button>
        </div>
      </article>

      {/* 액션 바 ~ 댓글 사이 가로 꽉찬 배너 (배너 이미지 중 랜덤) */}
      <PostDetailBanner />

      {/* 첨부 사진 확대 보기 오버레이 (가로 스와이프·좌우 버튼으로 이전/다음) */}
      {post.imageUrls && expandedImageIndex !== null && (
        <ImageLightbox
          imageUrls={post.imageUrls}
          currentIndex={expandedImageIndex}
          onIndexChange={setExpandedImageIndex}
          onClose={() => setExpandedImageIndex(null)}
        />
      )}

      {/* 댓글 목록 (개수는 상단 액션 바 '댓글 N'에 표시) */}
      <section className="mt-4 px-4 py-4">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            댓글이 없습니다.
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((root, rootIndex) => (
              <li
                key={root.id}
                className={`relative ${rootIndex > 0 ? 'border-t border-zinc-100 pt-4 dark:border-zinc-800' : ''}`}
              >
                {/* 원댓글: 왼쪽 끝부터 가로로 꽉 차게 */}
                <div className="relative flex flex-wrap gap-2" data-comment-id={root.id}>
                  <div
                    className="relative z-[1] h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
                    aria-hidden
                  >
                    {root.clubId != null && clubImageMap[root.clubId] ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- 동아리 로고 외부 URL */
                      <img
                        src={clubImageMap[root.clubId]}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center">
                        <PersonFillIcon className="h-[1.375rem] w-[1.375rem] shrink-0 text-zinc-500 dark:text-zinc-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-0 text-xs text-zinc-500 dark:text-zinc-400">
                        <span
                          className={`text-[13px] font-medium ${(root.isPostAuthor ?? (isAuthor && root.mine)) ? 'text-blue-500 dark:text-lime-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                        >
                          {root.authorName.replace(/([^\s])\(글쓴이\)/, '$1 (글쓴이)')}
                          {/* (글쓴이): API isPostAuthor 있으면 모두에게 표시, 없으면 글쓴이 본인만(isAuthor&&mine) */}
                          {(root.isPostAuthor ?? (isAuthor && root.mine)) &&
                          !root.authorName.includes('(글쓴이)')
                            ? ' (글쓴이)'
                            : ''}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {formatCommentWrittenAt(root.createdAt)}
                        </span>
                      </div>
                      <div className="mr-3 flex shrink-0 items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">
                        <div className="flex items-center gap-0">
                          <button
                            type="button"
                            className={`flex items-center gap-0.5 rounded p-0.5 transition-opacity hover:opacity-80 ${(commentLikedByMe[root.id] ?? root.liked) ? 'text-red-500 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-500'}`}
                            aria-label={`좋아요 ${commentLikeOverrides[root.id] ?? root.likeCount}개`}
                            onClick={() => {
                              if (!requireAuthOrOpenModal()) return;
                              if (commentLikedByMe[root.id] ?? root.liked) return;
                              if (!confirm('좋아요를 누르시겠습니까?')) return;
                              setCommentLikedByMe((prev) => ({ ...prev, [root.id]: true }));
                              setCommentLikeOverrides((prev) => ({
                                ...prev,
                                [root.id]: (prev[root.id] ?? root.likeCount) + 1,
                              }));
                              likeCommentMutation.mutate(root.id, {
                                onError: () => {
                                  setCommentLikedByMe((prev) => ({ ...prev, [root.id]: false }));
                                  setCommentLikeOverrides((prev) => ({
                                    ...prev,
                                    [root.id]: (prev[root.id] ?? root.likeCount) - 1,
                                  }));
                                },
                              });
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-3.5 w-3.5 shrink-0"
                            >
                              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                          </button>
                          {(commentLikeOverrides[root.id] ?? root.likeCount) > 0 && (
                            <span
                              className="text-xs text-zinc-500 dark:text-zinc-400"
                              aria-label={`좋아요 ${commentLikeOverrides[root.id] ?? root.likeCount}개`}
                            >
                              {commentLikeOverrides[root.id] ?? root.likeCount}
                            </span>
                          )}
                        </div>
                        <span
                          className="h-2.5 w-px shrink-0 bg-zinc-300 dark:bg-zinc-600"
                          aria-hidden
                        />
                        <button
                          type="button"
                          className="rounded p-0.5 text-zinc-500 transition-colors hover:opacity-80 dark:text-zinc-500"
                          aria-label="답글"
                          onClick={() => {
                            if (!requireAuthOrOpenModal()) return;
                            setReplyingToCommentId(root.id);
                            commentTextareaRef.current?.scrollIntoView({
                              behavior: 'auto',
                              block: 'end',
                            });
                            commentTextareaRef.current?.focus();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                        </button>
                        <span
                          className="h-2.5 w-px shrink-0 bg-zinc-300 dark:bg-zinc-600"
                          aria-hidden
                        />
                        <div
                          className="relative"
                          ref={commentMenuOpenId === root.id ? commentMenuRef : undefined}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCommentMenuOpenId((prev) => (prev === root.id ? null : root.id))
                            }
                            className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                            aria-label="더보기"
                            aria-expanded={commentMenuOpenId === root.id}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {commentMenuOpenId === root.id && (
                            <div
                              className="action-menu-dropdown absolute top-full right-0 z-10 mt-0.5 min-w-[100px] rounded-lg border border-zinc-200 bg-white py-1 dark:border-zinc-700 dark:bg-zinc-800"
                              role="menu"
                            >
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                role="menuitem"
                                onClick={() => {
                                  setCommentMenuOpenId(null);
                                  if (root.mine) {
                                    alert('본인은 신고할 수 없습니다.');
                                    return;
                                  }
                                  if (!requireAuthOrOpenModal()) return;
                                  router.push(`/mypage/settings/report?type=comment&id=${root.id}`);
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
                                  if (root.mine || isAdmin) {
                                    deleteCommentMutation.mutate(root.id, {
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
                  </div>
                  <div className="-mt-3 w-full min-w-0">
                    <p className="mt-3 w-full min-w-0 pr-3 pb-1.5 pl-0.5 text-sm font-normal break-words break-all text-zinc-600 dark:text-zinc-400">
                      {preventBreakAfterQuestion(root.content)}
                    </p>
                  </div>
                </div>
                {/* 답글들: 왼쪽 화살표로 답글 표시 */}
                {(root.replies?.length ?? 0) > 0 && (
                  <div className="relative">
                    {(root.replies ?? []).map((reply) => {
                      const likeCount = commentLikeOverrides[reply.id] ?? reply.likeCount;
                      const liked = commentLikedByMe[reply.id] ?? reply.liked ?? false;
                      const isMine = reply.mine ?? false;
                      return (
                        <div
                          key={reply.id}
                          className={`relative flex gap-2 pt-3 ${replyRowIsAppView ? 'pl-7 sm:pl-9' : 'pl-5 sm:pl-7'}`}
                          data-comment-id={reply.id}
                        >
                          <span
                            className="absolute top-4 left-0 z-[1] flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500"
                            aria-hidden
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="stroke-current"
                            >
                              <path
                                d="M16 19L21 14L16 9"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M21 14H13C7.477 14 3 9.523 3 4V3"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <div className="relative z-[1] flex min-w-0 flex-1 flex-wrap gap-2 rounded-lg bg-zinc-50 px-3 pt-2.5 pb-2 dark:bg-zinc-800/50">
                            <div
                              className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
                              aria-hidden
                            >
                              {reply.clubId != null && clubImageMap[reply.clubId] ? (
                                /* eslint-disable-next-line @next/next/no-img-element -- 동아리 로고 외부 URL */
                                <img
                                  src={clubImageMap[reply.clubId]}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span className="flex size-full items-center justify-center">
                                  <PersonFillIcon className="h-[1.375rem] w-[1.375rem] shrink-0 text-zinc-500 dark:text-zinc-500" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex h-7 items-center justify-between gap-2">
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0 text-xs text-zinc-500 dark:text-zinc-400">
                                  <span
                                    className={`text-[13px] leading-tight font-medium ${(reply.isPostAuthor ?? (isAuthor && isMine)) ? 'text-blue-500 dark:text-lime-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                                  >
                                    {reply.authorName.replace(/([^\s])\(글쓴이\)/, '$1 (글쓴이)')}
                                    {(reply.isPostAuthor ?? (isAuthor && isMine)) &&
                                    !reply.authorName.includes('(글쓴이)')
                                      ? ' (글쓴이)'
                                      : ''}
                                  </span>
                                  <span className="text-[11px] leading-tight text-zinc-400 dark:text-zinc-500">
                                    {formatCommentWrittenAt(reply.createdAt)}
                                  </span>
                                </div>
                                <div className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-0 dark:bg-zinc-700">
                                  <div className="flex items-center gap-0">
                                    <button
                                      type="button"
                                      className={`flex items-center gap-0.5 rounded p-0.5 transition-opacity hover:opacity-80 ${liked ? 'text-red-500 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-500'}`}
                                      aria-label={`좋아요 ${likeCount}개`}
                                      onClick={() => {
                                        if (liked) return;
                                        if (!confirm('좋아요를 누르시겠습니까?')) return;
                                        setCommentLikedByMe((prev) => ({
                                          ...prev,
                                          [reply.id]: true,
                                        }));
                                        setCommentLikeOverrides((prev) => ({
                                          ...prev,
                                          [reply.id]: (prev[reply.id] ?? reply.likeCount) + 1,
                                        }));
                                        likeCommentMutation.mutate(reply.id, {
                                          onError: () => {
                                            setCommentLikedByMe((prev) => ({
                                              ...prev,
                                              [reply.id]: false,
                                            }));
                                            setCommentLikeOverrides((prev) => ({
                                              ...prev,
                                              [reply.id]: (prev[reply.id] ?? reply.likeCount) - 1,
                                            }));
                                          },
                                        });
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-3.5 w-3.5 shrink-0"
                                      >
                                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                      </svg>
                                    </button>
                                    {likeCount > 0 && (
                                      <span
                                        className="text-xs text-zinc-500 dark:text-zinc-400"
                                        aria-label={`좋아요 ${likeCount}개`}
                                      >
                                        {likeCount}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className="h-2.5 w-px shrink-0 bg-zinc-300 dark:bg-zinc-600"
                                    aria-hidden
                                  />
                                  <div
                                    className="relative"
                                    ref={
                                      commentMenuOpenId === reply.id ? commentMenuRef : undefined
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCommentMenuOpenId((prev) =>
                                          prev === reply.id ? null : reply.id
                                        )
                                      }
                                      className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                                      aria-label="더보기"
                                      aria-expanded={commentMenuOpenId === reply.id}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-3.5 w-3.5"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                    {commentMenuOpenId === reply.id && (
                                      <div
                                        className="action-menu-dropdown absolute top-full right-0 z-10 mt-0.5 min-w-[100px] rounded-lg border border-zinc-200 bg-white py-1 dark:border-zinc-700 dark:bg-zinc-800"
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
                                            if (!requireAuthOrOpenModal()) return;
                                            router.push(
                                              `/mypage/settings/report?type=comment&id=${reply.id}`
                                            );
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
                                            if (isMine || isAdmin) {
                                              deleteCommentMutation.mutate(reply.id, {
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
                            </div>
                            <div className="-mt-3 w-full min-w-0">
                              <p className="mt-3 w-full min-w-0 pr-3 pb-1.5 pl-0.5 text-sm font-normal break-words break-all text-zinc-600 dark:text-zinc-400">
                                {preventBreakAfterQuestion(reply.content)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 삭제 불가 토스트: 본인 댓글이 아닐 때 */}
      {deleteDeniedToast && (
        <div
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-white dark:bg-zinc-700"
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
        canWrite={Boolean(accessToken)}
        onRequireAuth={() => openLoginModal(returnPath || '/community')}
        isCommentSubmitting={createCommentMutation.isPending}
      />
    </div>
  );
}
