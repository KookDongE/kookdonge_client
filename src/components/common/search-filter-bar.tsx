'use client';

import { useEffect, useRef, useState, type Key } from 'react';

import { Input, ListBox, Select } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubType, College, RecruitmentStatus } from '@/types/api';

const CATEGORY_OPTIONS: { value: ClubCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '분야' },
  { value: 'PERFORMING_ARTS', label: '공연' },
  { value: 'LIBERAL_ARTS_SERVICE', label: '봉사' },
  { value: 'EXHIBITION_ARTS', label: '전시' },
  { value: 'RELIGION', label: '종교' },
  { value: 'BALL_LEISURE', label: '구기' },
  { value: 'PHYSICAL_MARTIAL_ARTS', label: '체육' },
  { value: 'ACADEMIC', label: '학술' },
];

const TYPE_OPTIONS: { value: ClubType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '동아리 유형' },
  { value: 'CENTRAL', label: '중앙동아리' },
  { value: 'DEPARTMENTAL', label: '과동아리' },
  { value: 'ACADEMIC_SOCIETY', label: '학회' },
  { value: 'CLUB', label: '소모임' },
];

const COLLEGE_OPTIONS: { value: College | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '단과대' },
  { value: 'GLOBAL_HUMANITIES', label: '글로벌인문지역대학' },
  { value: 'SOCIAL_SCIENCE', label: '사회과학대학' },
  { value: 'LAW', label: '법과대학' },
  { value: 'ECONOMICS', label: '경상대학' },
  { value: 'BUSINESS', label: '경영대학' },
  { value: 'FREE_MAJOR', label: '자유전공' },
  { value: 'ENGINEERING', label: '창의공과대학' },
  { value: 'SOFTWARE', label: '소프트웨어융합대학' },
  { value: 'AUTOMOTIVE', label: '자동차융합대학' },
  { value: 'SCIENCE', label: '과학기술대학' },
  { value: 'ARCHITECTURE', label: '건축대학' },
  { value: 'DESIGN', label: '조형대학' },
  { value: 'ARTS', label: '예술대학' },
  { value: 'PHYSICAL_EDUCATION', label: '체육대학' },
  { value: 'FUTURE_MOBILITY', label: '미래모빌리티학과' },
  { value: 'LIBERAL_ARTS', label: '교양대학' },
];

const STATUS_OPTIONS: { value: RecruitmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '모집상태' },
  { value: 'RECRUITING', label: '모집중' },
  { value: 'SCHEDULED', label: '모집예정' },
  { value: 'CLOSED', label: '모집마감' },
];

/** 관리자 개설승인 페이지용: 상태 = 대기/승인/거절 */
const APPLICATION_STATUS_OPTIONS: {
  value: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  label: string;
}[] = [
  { value: 'ALL', label: '상태' },
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '거절' },
];

/** 정렬: 기본순(무작위) 항상 첫 번째, 그 다음 이름순/좋아요순/조회수순 */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'default', label: '기본순' },
  { value: 'name,asc', label: '이름순' },
  { value: 'popularity', label: '좋아요순' },
  { value: 'viewCount', label: '조회수순' },
];
const VALID_SORT_SET = new Set(SORT_OPTIONS.map((o) => o.value));

/** key={query}로 감싸서 URL q 변경 시 리마운트되며 초기값 동기화 (effect 내 setState 방지) */
function SearchInput({
  initialQuery,
  setQuery,
  placeholder,
}: {
  initialQuery: string | null;
  setQuery: (v: string | null) => void;
  placeholder: string;
}) {
  const [searchInput, setSearchInput] = useState(() => initialQuery ?? '');
  const prevInitialQueryRef = useRef(initialQuery);

  // URL이 바뀌었을 때 입력이 비어 있으면 URL 값으로 동기화 (뒤로가기 등). 비동기 setState로 린트 회피
  useEffect(() => {
    const fromUrl = initialQuery ?? '';
    if (prevInitialQueryRef.current === initialQuery) return;
    prevInitialQueryRef.current = initialQuery;
    const t = setTimeout(() => {
      setSearchInput((prev) => {
        const trimmed = prev.trim() || '';
        if (fromUrl === trimmed) return prev;
        if (trimmed !== '') return prev;
        return fromUrl;
      });
    }, 0);
    return () => clearTimeout(t);
  }, [initialQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput.trim() || null), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setQuery]);

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      className="w-full border border-zinc-300 bg-zinc-50 pl-10 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
      aria-label="검색"
    />
  );
}

type SearchFilterBarProps = {
  placeholder?: string;
  stickyHideOnScroll?: boolean;
  useGlass?: boolean;
  className?: string;
  /** true면 4번째 필터가 "모집상태" 대신 "상태"(대기/승인/거절)로 표시 (관리자 개설승인용) */
  applicationStatusFilter?: boolean;
};

export function SearchFilterBar({
  placeholder = '어떤 동아리를 찾으시나요?',
  stickyHideOnScroll = true,
  useGlass = false,
  className = '',
  applicationStatusFilter = false,
}: SearchFilterBarProps) {
  const [category, setCategory] = useQueryState('category', parseAsString);
  const [status, setStatus] = useQueryState('status', parseAsString);
  const [clubType, setClubType] = useQueryState('clubType', parseAsString);
  const [college, setCollege] = useQueryState('college', parseAsString);
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('default'));
  const [query, setQuery] = useQueryState('q', parseAsString);
  const [isVisible, setIsVisible] = useState(true);
  const [collegeSelectOpen, setCollegeSelectOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const filterBarRef = useRef<HTMLDivElement>(null);
  /** 선택으로 닫은 직후 웹뷰에서 다시 열리는 것 방지 */
  const collegeClosedBySelectionRef = useRef(false);

  const categoryVal = category ?? 'ALL';
  const statusVal = status ?? 'ALL';
  const clubTypeVal = clubType ?? 'ALL';
  const collegeVal = college ?? 'ALL';
  const sortVal = sort != null && VALID_SORT_SET.has(sort) ? sort : 'default';
  /** 과 필터: 중앙동아리 선택 시에만 숨김 (전체/학과동아리/학회/소모임일 때는 항상 노출) */
  const showCollegeFilter = clubTypeVal !== 'CENTRAL';

  // URL에 없는 정렬 값이면 기본순으로 정규화
  useEffect(() => {
    if (sort != null && sort !== '' && !VALID_SORT_SET.has(sort)) {
      setSort('default');
    }
  }, [sort, setSort]);

  // 중앙동아리 선택 시 단과대 선택 초기화
  useEffect(() => {
    if (!showCollegeFilter && college != null && college !== '') {
      setCollege(null);
    }
  }, [showCollegeFilter, college, setCollege]);

  // 스크롤·외부 클릭 시 필터 드롭다운 닫기 (포커스 해제로 팝오버 닫힘)
  useEffect(() => {
    const scrollEl =
      document.querySelector('[data-scroll-container]') ??
      document.querySelector('main') ??
      document.documentElement;
    const closeDropdowns = () => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active?.closest?.('[data-slot="trigger"]') ||
        active?.getAttribute?.('role') === 'combobox'
      ) {
        active.blur();
      }
    };
    const handleScroll = () => closeDropdowns();
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (filterBarRef.current?.contains(target)) return;
      // 드롭다운(팝오버/리스트박스) 안을 클릭한 경우에는 닫지 않음 — 포털이라 filterBarRef 밖에 있음
      if (
        (target as HTMLElement).closest?.(
          '[role="listbox"], [role="dialog"], [data-slot="popover"], [data-slot="listbox"]'
        )
      )
        return;
      closeDropdowns();
    };
    scrollEl.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  // 스크롤 시 필터바 숨김(애니메이션) — 실제 스크롤은 [data-scroll-container](PullToRefresh 내부)에서 발생
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
      const currentScrollY = getScrollY();
      const last = lastScrollYRef.current;
      if (currentScrollY <= THRESHOLD) {
        setIsVisible(true);
      } else if (currentScrollY > last && currentScrollY > THRESHOLD) {
        setIsVisible(false);
      } else if (currentScrollY < last) {
        setIsVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };
    handleScroll(); // 마운트/홈 진입 시 현재 스크롤 위치와 동기화(필터·인기동아리 겹침 방지)
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [stickyHideOnScroll]);

  /** 선택 직후 팝오버가 완전히 닫히도록 포커스 해제 (지연으로 재오픈 방지) */
  const closeSelectPopover = () => {
    setTimeout(() => (document.activeElement as HTMLElement | null)?.blur(), 100);
  };

  const handleCategoryChange = (value: Key | null) => {
    setCategory(value === 'ALL' || value === null ? null : (value as string));
    closeSelectPopover();
  };
  const handleStatusChange = (value: Key | null) => {
    setStatus(value === 'ALL' || value === null ? null : (value as string));
    closeSelectPopover();
  };
  const handleClubTypeChange = (value: Key | null) => {
    setClubType(value === 'ALL' || value === null ? null : (value as string));
    closeSelectPopover();
  };
  const handleCollegeChange = (value: Key | null) => {
    setCollege(value === 'ALL' || value === null ? null : (value as string));
    collegeClosedBySelectionRef.current = true;
    setCollegeSelectOpen(false);
    closeSelectPopover();
    setTimeout(() => {
      collegeClosedBySelectionRef.current = false;
    }, 250);
  };
  const handleSortChange = (value: Key | null) => {
    setSort((value as string) || 'default');
    closeSelectPopover();
  };

  const bgClass = useGlass ? 'glass' : 'bg-[var(--card)]';
  return (
    <div
      ref={filterBarRef}
      className={
        stickyHideOnScroll
          ? `${bgClass} sticky top-0 z-0 border-y-0 px-4 pt-0 pb-2 transition-[transform,opacity] duration-300 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'} ${className}`
          : `border-b border-zinc-200 ${bgClass} px-4 py-2 dark:border-zinc-700 ${className}`
      }
    >
      <div className="relative mb-3">
        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <SearchInput initialQuery={query} setQuery={setQuery} placeholder={placeholder} />
      </div>

      {/* 필터: 기본 = 동아리 유형만, 과동아리 선택 시 단과대 추가 노출 */}
      <div className="no-scrollbar -mr-4 flex items-center gap-2 overflow-x-auto p-1">
        {/* 1. 동아리 유형 (기본 노출) */}
        <Select
          className="shrink-0"
          placeholder="동아리 유형"
          aria-label="동아리 유형 선택"
          selectedKey={clubTypeVal}
          onSelectionChange={(key) => handleClubTypeChange(key ?? 'ALL')}
        >
          <Select.Trigger className="max-w-[100px] min-w-[100px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {TYPE_OPTIONS.map((opt) => (
                <ListBox.Item
                  key={opt.value}
                  id={opt.value}
                  textValue={opt.label}
                  className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
                >
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* 2. 단과대 선택 (중앙동아리 선택 시에만 숨김) */}
        {showCollegeFilter && (
          <Select
            className="shrink-0"
            placeholder="단과대"
            aria-label="단과대 선택"
            selectedKey={collegeVal}
            isOpen={collegeSelectOpen}
            onOpenChange={(open) => {
              if (open && collegeClosedBySelectionRef.current) {
                setCollegeSelectOpen(false);
                return;
              }
              setCollegeSelectOpen(open);
            }}
            onSelectionChange={(key) => handleCollegeChange(key ?? 'ALL')}
          >
            <Select.Trigger className="max-w-[100px] min-w-[72px] truncate rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
              <Select.Value className="truncate [color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
              <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
            </Select.Trigger>
            <Select.Popover className="max-h-[50dvh] overflow-hidden">
              <ListBox className="max-h-[40dvh] overflow-y-auto" aria-label="단과대 목록">
                {COLLEGE_OPTIONS.map((opt) => (
                  <ListBox.Item
                    key={opt.value}
                    id={opt.value}
                    textValue={opt.label}
                    className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
                  >
                    {opt.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}

        {/* 3. 분야 */}
        <Select
          className="shrink-0"
          placeholder="분야"
          aria-label="분야 선택"
          selectedKey={categoryVal}
          onSelectionChange={(key) => handleCategoryChange(key ?? 'ALL')}
        >
          <Select.Trigger className="max-w-[72px] min-w-[72px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {CATEGORY_OPTIONS.map((opt) => (
                <ListBox.Item
                  key={opt.value}
                  id={opt.value}
                  textValue={opt.label}
                  className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
                >
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* 4. 모집상태 (일반) / 상태·대기·승인·거절 (관리자 개설승인) */}
        <Select
          className="shrink-0"
          placeholder={applicationStatusFilter ? '상태' : '모집상태'}
          aria-label={applicationStatusFilter ? '상태 선택' : '모집상태 선택'}
          selectedKey={statusVal}
          onSelectionChange={(key) => handleStatusChange(key ?? 'ALL')}
        >
          <Select.Trigger className="max-w-[100px] min-w-[88px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
            <Select.Value className="whitespace-nowrap [color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(applicationStatusFilter ? APPLICATION_STATUS_OPTIONS : STATUS_OPTIONS).map(
                (opt) => (
                  <ListBox.Item
                    key={opt.value}
                    id={opt.value}
                    textValue={opt.label}
                    className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
                  >
                    {opt.label}
                  </ListBox.Item>
                )
              )}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* 5. 정렬 (백엔드 sort 파라미터) */}
        <Select
          className="shrink-0"
          placeholder="정렬"
          aria-label="정렬 선택"
          selectedKey={sortVal}
          onSelectionChange={(key) => handleSortChange(key ?? 'default')}
        >
          <Select.Trigger className="max-w-[88px] min-w-[88px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SORT_OPTIONS.map((opt) => (
                <ListBox.Item
                  key={opt.value}
                  id={opt.value}
                  textValue={opt.label}
                  className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
                >
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  );
}
