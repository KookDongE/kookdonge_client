'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { Input } from '@heroui/react';

export type CommunitySort = 'latest' | 'popular';

/** 검색 버튼용 돋보기 아이콘 */
const SearchSubmitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
  >
    <path
      fillRule="evenodd"
      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
      clipRule="evenodd"
    />
  </svg>
);

/** 커뮤니티 검색 입력줄: 오른쪽 돋보기 버튼만. */
export function CommunitySearchInputRow({
  value,
  onChange,
  onSubmit,
  placeholder = '게시글 검색',
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative"
    >
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border border-zinc-300 bg-zinc-50 pr-11 pl-4 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        aria-label={placeholder}
      />
      <button
        type="submit"
        className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full p-1.5 transition-opacity hover:opacity-80"
        aria-label="검색"
      >
        <SearchSubmitIcon />
      </button>
    </form>
  );
}

type CommunitySearchFilterProps = {
  /** 검색어 (제어) */
  query: string;
  onQueryChange: (value: string) => void;
  /** 정렬 (제어) */
  sort: CommunitySort;
  onSortChange: (value: CommunitySort) => void;
  /** sticky 시 스크롤에 따라 숨김 여부 */
  stickyHideOnScroll?: boolean;
  /** true면 검색 아래 필터(최신순/인기순, 내가 쓴 글 등) 영역 숨김 */
  hideFilters?: boolean;
  /** true면 입력 시가 아닌 검색 버튼/엔터 시에만 onQueryChange 호출 */
  submitOnly?: boolean;
  className?: string;
};

export function CommunitySearchFilter({
  query,
  onQueryChange,
  sort,
  onSortChange,
  stickyHideOnScroll = false,
  hideFilters = false,
  submitOnly = false,
  className = '',
}: CommunitySearchFilterProps) {
  const [searchInput, setSearchInput] = useState(() => query);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const prevQueryRef = useRef(query);

  // query(외부) 변경 시 입력값 동기화 — 비동기로 처리해 setState-in-effect 린트 회피
  useEffect(() => {
    if (prevQueryRef.current === query) return;
    prevQueryRef.current = query;
    const t = setTimeout(() => setSearchInput(query), 0);
    return () => clearTimeout(t);
  }, [query]);

  // submitOnly일 때는 검색 버튼/엔터 시에만 검색하므로, 입력 중 디바운스 호출 안 함
  useEffect(() => {
    if (submitOnly) return;
    const timer = setTimeout(() => onQueryChange(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [submitOnly, searchInput, onQueryChange]);

  useEffect(() => {
    if (!stickyHideOnScroll) return;
    const scrollEl =
      document.querySelector('[data-scroll-container]') ??
      document.querySelector('main') ??
      document.documentElement;
    const getScrollY = () =>
      scrollEl === document.documentElement ? window.scrollY : (scrollEl as HTMLElement).scrollTop;
    const THRESHOLD = 60;
    const handleScroll = () => {
      const current = getScrollY();
      const last = lastScrollYRef.current;
      if (current <= THRESHOLD) setIsVisible(true);
      else if (current > last && current > THRESHOLD) setIsVisible(false);
      else if (current < last) setIsVisible(true);
      lastScrollYRef.current = current;
    };
    handleScroll();
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [stickyHideOnScroll]);

  const stickyClass = stickyHideOnScroll
    ? `sticky top-0 z-30 transition-[transform,opacity] duration-300 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`
    : '';

  return (
    <div className={`glass border-y-0 ${stickyClass} ${className}`}>
      {/* 검색: 입력 + 오른쪽 돋보기 버튼 */}
      <div className="px-4 pt-2 pb-2">
        <CommunitySearchInputRow
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={() => onQueryChange(searchInput.trim())}
          placeholder="게시글 검색"
        />
      </div>

      {!hideFilters && (
        <div className="no-scrollbar flex flex-wrap items-center gap-2 px-4 pb-3">
          <div className="flex shrink-0 gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => onSortChange('latest')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === 'latest'
                  ? 'bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => onSortChange('popular')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === 'popular'
                  ? 'bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              인기순
            </button>
          </div>
          <Link
            href="/community/my-posts"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            내가 쓴 글
          </Link>
          <Link
            href="/community/commented"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            댓글 단 글
          </Link>
          <Link
            href="/community/liked"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            좋아요 누른 글
          </Link>
          <Link
            href="/community/saved"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            저장 누른 글
          </Link>
        </div>
      )}
    </div>
  );
}
