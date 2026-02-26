'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Button, Spinner } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubType, College, RecruitmentStatus } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import {
  useClubList,
  useDeleteClub,
  useToggleClubVisibility,
  useTopWeeklyLike,
  useTopWeeklyView,
} from '@/features/club/hooks';
import { AdminClubCard } from '@/components/common/admin-club-card';
import { ClubCard, ClubCardSkeleton } from '@/components/common/club-card';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

type RankingTab = 'view' | 'like';

function RankingSection() {
  const [activeTab, setActiveTab] = useState<RankingTab>('view');
  const { data: viewRankings, isLoading: viewLoading } = useTopWeeklyView();
  const { data: likeRankings, isLoading: likeLoading } = useTopWeeklyLike();
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const isLoading = activeTab === 'view' ? viewLoading : likeLoading;
  const rawRankings = activeTab === 'view' ? viewRankings : likeRankings;

  // API 응답이 배열 또는 { content: [...] } 형태일 수 있음
  type RankingItem = {
    id: number;
    name: string;
    logoImage: string;
    weeklyViewGrowth: number;
    weeklyLikeGrowth: number;
  };
  const rankings: RankingItem[] = Array.isArray(rawRankings)
    ? rawRankings
    : ((rawRankings as unknown as { content?: RankingItem[] })?.content ?? []);

  if (isLoading) {
    return (
      <section className="px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="skeleton h-8 w-20 rounded-full" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 w-24 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  const top5 = rankings?.slice(0, 5) || [];
  const isEmpty = !rankings || rankings.length === 0;

  return (
    <section className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">이번 주 인기</span>
        <div className="flex items-center gap-2">
          {/* Tab Buttons */}
          <div className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setActiveTab('view')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'view'
                  ? 'bg-blue-500 text-white dark:bg-lime-400 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              조회수
            </button>
            <button
              onClick={() => setActiveTab('like')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'like'
                  ? 'bg-blue-500 text-white dark:bg-lime-400 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              좋아요
            </button>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex h-36 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          인기 동아리가 없습니다
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="no-scrollbar flex gap-3 overflow-x-auto pt-2 pb-2 pl-2"
          >
            {top5.map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/clubs/${club.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="club-logo-wrap relative flex w-24 shrink-0 flex-col items-center rounded-2xl bg-zinc-100 p-3 dark:bg-zinc-800"
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white dark:bg-lime-400 dark:text-zinc-900">
                      {index + 1}
                    </div>

                    {/* Avatar - 이미지 없거나 로드 실패 시 아이콘 */}
                    <div className="club-logo-placeholder relative mb-2 h-14 w-14 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-blue-400/30 dark:bg-zinc-700 dark:ring-lime-400/30">
                      {club.logoImage && !imageError[club.id] ? (
                        <>
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
                        <div className="h-full w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
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

function ClubListSection() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(0));
  const [category] = useQueryState('category', parseAsString.withDefault(''));
  const [status] = useQueryState('status', parseAsString.withDefault(''));
  const [clubType] = useQueryState('clubType', parseAsString.withDefault(''));
  const [college] = useQueryState('college', parseAsString.withDefault(''));
  const [sort] = useQueryState('sort', parseAsString.withDefault('name,asc'));
  const [query] = useQueryState('q', parseAsString.withDefault(''));
  const [deleteModalClubId, setDeleteModalClubId] = useState<number | null>(null);

  // 필터/정렬 변경 시 1페이지로 리셋 (백엔드에서 정렬·페이징 처리)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(0);
  }, [category, status, clubType, college, sort, query, setPage]);

  const { data, isLoading } = useClubList({
    category: category && category !== 'ALL' ? (category as ClubCategory) : undefined,
    type: clubType && clubType !== 'ALL' ? (clubType as ClubType) : undefined,
    college:
      clubType === 'DEPARTMENTAL' && college && college !== 'ALL'
        ? (college as College)
        : undefined,
    recruitmentStatus: status && status !== 'ALL' ? (status as RecruitmentStatus) : undefined,
    query: query || undefined,
    sort: sort || 'name,asc',
    page,
    size: 20,
  });

  const { data: profile } = useMyProfile();
  /** 시스템 관리자(ADMIN)만 홈 검색 결과 카드에서 스와이프(숨기기/삭제) 노출. 리더(managedClubIds)는 동아리 상세·관리 페이지에서만 사용 */
  const isAdmin = isSystemAdmin(profile);

  const toggleVisibility = useToggleClubVisibility();
  const deleteClub = useDeleteClub();

  const handleToggleVisibility = (clubId: number, isHidden: boolean) => {
    toggleVisibility.mutate({ clubId, isHidden: !isHidden });
  };

  const handleDelete = (clubId: number) => {
    setDeleteModalClubId(clubId);
  };

  const handleDeleteConfirm = () => {
    if (deleteModalClubId) {
      deleteClub.mutate(deleteModalClubId);
      setDeleteModalClubId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        {[1, 2, 3].map((i) => (
          <ClubCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <span className="mb-3 text-5xl">🔍</span>
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
            <span className="font-bold text-blue-500 dark:text-lime-400">{data.totalElements}</span>
            개의 동아리
          </span>
        </div>

        {/* Club Cards */}
        <AnimatePresence mode="wait">
          <div className="space-y-4">
            {data.content.map((club, index) => {
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
                };
                return (
                  <AdminClubCard
                    key={club.id}
                    club={adminClubData}
                    index={index}
                    onToggleVisibility={handleToggleVisibility}
                    onDelete={handleDelete}
                  />
                );
              } else {
                // 일반 사용자는 일반 ClubCard 사용
                return <ClubCard key={club.id} club={club} index={index} />;
              }
            })}
          </div>
        </AnimatePresence>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setPage(Math.max(0, page - 1))}
                isDisabled={data.first}
                className="touch-btn rounded-full"
              >
                이전
              </Button>
            </motion.div>
            <span className="min-w-[60px] text-center text-sm font-medium text-zinc-500">
              <span className="text-blue-500 dark:text-lime-400">{page + 1}</span> /{' '}
              {data.totalPages}
            </span>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setPage(page + 1)}
                isDisabled={data.last}
                className="touch-btn rounded-full"
              >
                다음
              </Button>
            </motion.div>
          </div>
        )}
      </div>
      {deleteModalClubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-zinc-100">
              동아리 삭제
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-zinc-400">
              정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onPress={() => setDeleteModalClubId(null)}>
                취소
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onPress={handleDeleteConfirm}
                isPending={deleteClub.isPending}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HomeContent() {
  return (
    <>
      <ClubFilters />
      <RankingSection />
      <ClubListSection />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
