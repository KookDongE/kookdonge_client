'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { parseAsString, useQueryState } from 'nuqs';
import { createPortal } from 'react-dom';

import { ClubCategory, ClubType, College, RecruitmentStatus } from '@/types/api';
import { shuffleArray } from '@/lib/utils';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import {
  useDeleteClub,
  useInfiniteClubList,
  useTopWeeklyLike,
  useTopWeeklyView,
} from '@/features/club/hooks';
import { AdminClubCard } from '@/components/common/admin-club-card';
import { ClubCard, ClubCardSkeleton } from '@/components/common/club-card';
import { DefaultClubImage } from '@/components/common/default-club-image';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

type RankingTab = 'view' | 'like';

function RankingSection({ returnTo }: { returnTo?: string }) {
  const [activeTab, setActiveTab] = useState<RankingTab>('view');
  const rankingScrollRef = useRef<HTMLDivElement>(null);
  const {
    data: viewRankings,
    isLoading: viewLoading,
    isError: viewError,
    refetch: refetchView,
  } = useTopWeeklyView();
  const {
    data: likeRankings,
    isLoading: likeLoading,
    isError: likeError,
    refetch: refetchLike,
  } = useTopWeeklyLike();
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  // 데스크톱: 터치스크린처럼 드래그로 가로 스크롤 (실제로 드래그했을 때만 링크 클릭 방지)
  const isDraggingRef = useRef(false);
  const didMoveRef = useRef(false);
  const didDragThisSessionRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const onRankingMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rankingScrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    didMoveRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const onRankingMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rankingScrollRef.current;
    if (!el || !isDraggingRef.current) return;
    didMoveRef.current = true;
    e.preventDefault();
    const walk = e.pageX - startXRef.current;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const onRankingMouseUpLeave = () => {
    const el = rankingScrollRef.current;
    if (!el) return;
    if (didMoveRef.current) didDragThisSessionRef.current = true;
    isDraggingRef.current = false;
    didMoveRef.current = false;
    el.style.cursor = 'grab';
    el.style.userSelect = '';
  };

  const onRankingClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDragThisSessionRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didDragThisSessionRef.current = false;
    }
  };

  const isLoading = activeTab === 'view' ? viewLoading : likeLoading;
  const isError = activeTab === 'view' ? viewError : likeError;
  const _refetchRanking = activeTab === 'view' ? refetchView : refetchLike;
  const rawRankings = activeTab === 'view' ? viewRankings : likeRankings;

  // API 응답이 배열 또는 { content: [...] } 형태일 수 있음
  type RankingItem = {
    id: number;
    name: string;
    logoImage: string;
    weeklyViewGrowth: number;
    weeklyLikeGrowth: number;
  };
  const rawList: RankingItem[] = Array.isArray(rawRankings)
    ? rawRankings
    : ((rawRankings as unknown as { content?: RankingItem[] })?.content ?? []);

  // 조회수/좋아요 탭에 맞춰 실제 순위대로 정렬 (높은 순 → 1위, 2위, …)
  const rankings: RankingItem[] =
    activeTab === 'view'
      ? [...rawList].sort((a, b) => (b.weeklyViewGrowth ?? 0) - (a.weeklyViewGrowth ?? 0))
      : [...rawList].sort((a, b) => (b.weeklyLikeGrowth ?? 0) - (a.weeklyLikeGrowth ?? 0));

  if (isLoading) {
    return (
      <section className="px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="skeleton h-8 w-20 rounded-full" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
        <div className="no-scrollbar flex w-full min-w-0 [touch-action:pan-x] gap-3 overflow-x-auto overflow-y-hidden pb-2 [-webkit-overflow-scrolling:touch]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 w-24 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-5">
        <div className="mb-4 flex items-center justify-between px-4">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">이번 주 인기</span>
        </div>
        <div className="mx-4 flex h-36 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            인기 동아리를 불러오지 못했습니다
          </p>
        </div>
      </section>
    );
  }

  const top10 = rankings?.slice(0, 10) || [];
  const isEmpty = !rankings || rankings.length === 0;

  return (
    <section className="py-5">
      <div className="mb-4 flex items-center justify-between px-4">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">이번 주 인기</span>
        <div className="flex items-center gap-2">
          {/* Tab Buttons */}
          <div
            className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
            role="tablist"
            aria-label="인기 순위 기준"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'view'}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('view');
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                activeTab === 'view'
                  ? '!bg-blue-500 !text-white dark:!bg-lime-400 dark:!text-zinc-900'
                  : '!bg-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              조회수
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'like'}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('like');
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                activeTab === 'like'
                  ? '!bg-blue-500 !text-white dark:!bg-lime-400 dark:!text-zinc-900'
                  : '!bg-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              좋아요
            </button>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="mx-4 flex h-36 flex-col items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <span>이번 주 인기 동아리가 없습니다</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
            매주 월요일 00:00에 갱신됩니다
          </span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            ref={rankingScrollRef}
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onMouseDown={onRankingMouseDown}
            onMouseMove={onRankingMouseMove}
            onMouseUp={onRankingMouseUpLeave}
            onMouseLeave={onRankingMouseUpLeave}
            onClickCapture={onRankingClickCapture}
            role="region"
            aria-label="인기 동아리 가로 스크롤"
            className="no-scrollbar flex w-full min-w-0 cursor-grab [touch-action:pan-x] gap-3 overflow-x-auto overflow-y-hidden pt-2 pb-2 pl-4 [-webkit-overflow-scrolling:touch] active:cursor-grabbing"
          >
            {top10.map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={
                    returnTo != null && returnTo !== ''
                      ? `/clubs/${club.id}?from=${encodeURIComponent(returnTo)}`
                      : `/clubs/${club.id}`
                  }
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="club-logo-wrap relative flex w-24 shrink-0 flex-col items-center rounded-2xl bg-zinc-100 p-3 dark:bg-zinc-800"
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white dark:bg-lime-400 dark:text-zinc-900">
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="club-logo-placeholder relative mb-2 h-14 w-14 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-blue-400/30 dark:bg-zinc-700 dark:ring-lime-400/30">
                      {club.logoImage && !imageError[club.id] ? (
                        <>
                          <div className="absolute inset-0 bg-white" aria-hidden />
                          {!imageLoaded[club.id] && (
                            <div className="skeleton absolute inset-0 rounded-full" />
                          )}
                          <Image
                            src={club.logoImage}
                            alt={club.name}
                            fill
                            className={`object-cover transition-opacity duration-300 ${
                              imageLoaded[club.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                            sizes="56px"
                            onLoad={() => setImageLoaded((prev) => ({ ...prev, [club.id]: true }))}
                            onError={() => setImageError((prev) => ({ ...prev, [club.id]: true }))}
                          />
                        </>
                      ) : (
                        <DefaultClubImage className="rounded-full object-cover" sizes="56px" />
                      )}
                    </div>

                    {/* Name */}
                    <span className="line-clamp-1 text-center text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {club.name}
                    </span>

                    {/* Growth Badge */}
                    <span className="mt-1 rounded-full bg-lime-400/20 px-2 py-0.5 text-[9px] font-medium text-lime-700 dark:bg-lime-400/30 dark:text-lime-300">
                      +{activeTab === 'view' ? club.weeklyViewGrowth : club.weeklyLikeGrowth}
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}

function ClubFilters() {
  return <SearchFilterBar stickyHideOnScroll placeholder="어떤 동아리를 찾으시나요?" />;
}

const VALID_SORT_VALUES = ['default', 'name,asc', 'popularity', 'viewCount'] as const;
function normalizeSort(sort: string | null): string {
  if (!sort) return 'default';
  return VALID_SORT_VALUES.includes(sort as (typeof VALID_SORT_VALUES)[number]) ? sort : 'default';
}

function ClubListSection({
  returnTo,
  reshuffleKey = 0,
}: {
  returnTo?: string;
  reshuffleKey?: number;
}) {
  const [category] = useQueryState('category', parseAsString);
  const [status] = useQueryState('status', parseAsString);
  const [clubType] = useQueryState('clubType', parseAsString);
  const [college] = useQueryState('college', parseAsString);
  const [sort] = useQueryState('sort', parseAsString.withDefault('default'));
  const [query] = useQueryState('q', parseAsString);
  const [deleteModalClubId, setDeleteModalClubId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const validRecruitmentStatus: RecruitmentStatus | undefined =
    status &&
    status !== 'ALL' &&
    (status === 'RECRUITING' || status === 'SCHEDULED' || status === 'CLOSED')
      ? (status as RecruitmentStatus)
      : undefined;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteClubList({
    category: category && category !== 'ALL' ? (category as ClubCategory) : undefined,
    type: clubType && clubType !== 'ALL' ? (clubType as ClubType) : undefined,
    college:
      clubType !== 'CENTRAL' && college && college !== 'ALL' ? (college as College) : undefined,
    recruitmentStatus: validRecruitmentStatus,
    query: (query && query.trim()) || undefined,
    sort: normalizeSort(sort ?? null),
    size: 20,
  });

  const rawClubs = data?.pages.flatMap((p) => p.content) ?? [];
  const sortVal = normalizeSort(sort ?? null);
  const clubs = useMemo(() => {
    if (sortVal === 'default') {
      return shuffleArray(rawClubs);
    }
    if (sortVal === 'name,asc') {
      return [...rawClubs].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
    }
    return rawClubs;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffleKey: 버튼 클릭 시 셔플 재실행용
  }, [rawClubs, sortVal, reshuffleKey]);
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: profile } = useMyProfile();
  /** 시스템 관리자(ADMIN)만 홈 검색 결과 카드에서 스와이프(삭제) 노출. 리더(managedClubIds)는 동아리 상세·관리 페이지에서만 사용 */
  const isAdmin = isSystemAdmin(profile);

  const deleteClub = useDeleteClub();

  const handleDelete = (clubId: number) => {
    setDeleteModalClubId(clubId);
    setDeleteConfirmName('');
  };

  const handleDeleteConfirm = () => {
    if (deleteModalClubId) {
      deleteClub.mutate(deleteModalClubId);
      setDeleteModalClubId(null);
      setDeleteConfirmName('');
    }
  };

  const deleteModalClub = deleteModalClubId ? clubs.find((c) => c.id === deleteModalClubId) : null;
  const isDeleteNameMatch =
    deleteModalClub != null && deleteConfirmName.trim() === (deleteModalClub.name ?? '').trim();

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        {[1, 2, 3].map((i) => (
          <ClubCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <p className="text-sm text-zinc-400">검색 결과가 없어요</p>
        <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">다른 키워드로 검색해보세요</p>
      </motion.div>
    );
  }

  if (!data || clubs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <p className="text-sm text-zinc-400">검색 결과가 없어요</p>
        <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">다른 키워드로 검색해보세요</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="px-4 py-4">
        {/* Result Count */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-blue-500 dark:text-lime-400">{totalElements}</span>
            개의 동아리 및 소모임
          </span>
        </div>

        {/* Club Cards (무한스크롤) */}
        <AnimatePresence mode="wait">
          <div className="space-y-4">
            {clubs.map((club, index) => {
              if (isAdmin) {
                // 관리자인 경우 AdminClubCard 사용 (스와이프 기능 포함)
                const adminClubData = {
                  id: club.id,
                  name: club.name,
                  logoImage: club.logoImage,
                  introduction: club.introduction,
                  category: club.category,
                  type: club.type,
                  isHidden: false,
                  recruitmentStatus: club.recruitmentStatus,
                  college: club.college,
                  dday: club.dday ?? 0,
                };
                return (
                  <AdminClubCard
                    key={club.id}
                    club={adminClubData}
                    index={index}
                    onDelete={handleDelete}
                    returnTo={returnTo}
                  />
                );
              } else {
                // 일반 사용자는 일반 ClubCard 사용
                return <ClubCard key={club.id} club={club} index={index} returnTo={returnTo} />;
              }
            })}
          </div>
        </AnimatePresence>

        {/* 무한스크롤: 하단 감지 시 다음 페이지 로드 */}
        <div ref={loadMoreRef} className="min-h-[24px] py-4" aria-hidden />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <ClubCardSkeleton />
          </div>
        )}
      </div>
      {deleteModalClubId &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-zinc-800">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-zinc-100">
                동아리 삭제
              </h3>
              <p className="mb-3 text-sm text-gray-600 dark:text-zinc-400">
                정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              {deleteModalClub && (
                <>
                  <p className="mb-6 text-sm text-gray-600 dark:text-zinc-400">
                    삭제하려면 동아리 이름{' '}
                    <strong className="text-gray-900 dark:text-zinc-100">
                      &quot;{deleteModalClub.name}&quot;
                    </strong>
                    을(를) 입력하세요.
                  </p>
                  {/* 네이티브 input 사용: HeroUI Input은 className(w-full, mt-6)이 실제 DOM에 반영되지 않아 간격/너비 제어 불가 */}
                  <input
                    type="text"
                    placeholder="동아리 이름 입력"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="mt-6 mb-6 w-full min-w-0 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
                    autoComplete="off"
                    aria-label="동아리 이름 확인"
                  />
                </>
              )}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onPress={() => {
                    setDeleteModalClubId(null);
                    setDeleteConfirmName('');
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  onPress={handleDeleteConfirm}
                  isPending={deleteClub.isPending}
                  isDisabled={!isDeleteNameMatch}
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function HomeContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const didInitialClearCheckRef = useRef(false);
  const hiddenAtRef = useRef<number | null>(null);
  /** bfcache 복원 시 동아리 목록 셔플만 다시 하기 위한 키 (refetch 없음) */
  const [reshuffleKey, setReshuffleKey] = useState(0);

  const FILTER_CLEAR_PENDING_KEY = 'filterClearPending_home';

  // 새로고침 시 필터 초기화 (마운트 후 1회만 검사 → 드롭다운 선택 시에는 초기화되지 않음)
  // 앱뷰: 이전 문서가 pagehide 시 남긴 sessionStorage 플래그가 있으면 초기화
  useEffect(() => {
    if (typeof window === 'undefined' || pathname !== '/home') return;
    if (didInitialClearCheckRef.current) return;
    didInitialClearCheckRef.current = true;
    const hasFilter =
      searchParams.get('category') ??
      searchParams.get('status') ??
      searchParams.get('clubType') ??
      searchParams.get('college') ??
      searchParams.get('q') ??
      (searchParams.get('sort') && searchParams.get('sort') !== 'name,asc');
    const pendingFromReload =
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem(FILTER_CLEAR_PENDING_KEY);
    if (hasFilter || pendingFromReload) {
      if (pendingFromReload) sessionStorage.removeItem(FILTER_CLEAR_PENDING_KEY);
      if (hasFilter) router.replace('/home', { scroll: false });
    }
  }, [pathname, router, searchParams]);

  // 앱뷰 풀리프레시: 페이지가 사라지기 직전에(필터가 있을 때만) 플래그 설정 → 새 문서 로드 시 위 effect에서 초기화
  useEffect(() => {
    const handlePagehide = () => {
      try {
        if (window.location.pathname !== '/home') return;
        const params = new URLSearchParams(window.location.search);
        const hasFilter =
          params.get('category') ??
          params.get('status') ??
          params.get('clubType') ??
          params.get('college') ??
          params.get('q') ??
          (params.get('sort') && params.get('sort') !== 'name,asc');
        if (hasFilter) sessionStorage.setItem(FILTER_CLEAR_PENDING_KEY, '1');
      } catch {
        // ignore
      }
    };
    window.addEventListener('pagehide', handlePagehide);
    return () => window.removeEventListener('pagehide', handlePagehide);
  }, []);

  // 앱뷰 풀리프레시: bfcache 복원 시 필터 초기화 + 동아리 목록 순서만 다시 셔플
  useEffect(() => {
    const handlePageshow = (e: PageTransitionEvent) => {
      if (e.persisted !== true) return;
      if (typeof window === 'undefined' || window.location.pathname !== '/home') return;
      setReshuffleKey((k) => k + 1);
      const params = new URLSearchParams(window.location.search);
      const hasFilter =
        params.get('category') ??
        params.get('status') ??
        params.get('clubType') ??
        params.get('college') ??
        params.get('q') ??
        (params.get('sort') && params.get('sort') !== 'name,asc');
      if (hasFilter) router.replace('/home', { scroll: false });
    };
    window.addEventListener('pageshow', handlePageshow);
    return () => window.removeEventListener('pageshow', handlePageshow);
  }, [router]);

  // 앱뷰 풀리프레시: 리마운트가 안 되는 WebView는 visibilitychange로 감지 (숨김 → 보임 시 0.8초 이상 지났으면 필터 초기화)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      }
      if (document.visibilityState !== 'visible') return;
      if (typeof window === 'undefined' || window.location.pathname !== '/home') return;
      const hiddenAt = hiddenAtRef.current;
      if (hiddenAt == null || Date.now() - hiddenAt < 800) return;
      hiddenAtRef.current = null;
      const params = new URLSearchParams(window.location.search);
      const hasFilter =
        params.get('category') ??
        params.get('status') ??
        params.get('clubType') ??
        params.get('college') ??
        params.get('q') ??
        (params.get('sort') && params.get('sort') !== 'name,asc');
      if (hasFilter) router.replace('/home', { scroll: false });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  const returnTo =
    pathname === '/home'
      ? `/home${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      : undefined;

  // 홈 진입 시 실제 스크롤 컨테이너(data-scroll-container)를 맨 위로. Next.js 기본 스크롤은 window 기준이라 필터/인기동아리 겹침 방지.
  useLayoutEffect(() => {
    if (pathname !== '/home') return;
    const el = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (el) el.scrollTo(0, 0);
  }, [pathname]);

  const hasSearchQuery = Boolean(searchParams.get('q')?.trim());

  return (
    <>
      <ClubFilters />
      {!hasSearchQuery && <RankingSection returnTo={returnTo} />}
      <ClubListSection returnTo={returnTo} reshuffleKey={reshuffleKey} />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 px-4 py-4">
          {[1, 2, 3].map((i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
