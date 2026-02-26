'use client';

import { useEffect, useState, type Key } from 'react';

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
  { value: 'ALL', label: '단과대 전체' },
  { value: 'GLOBAL_HUMANITIES', label: '글로벌인문대학' },
  { value: 'SOCIAL_SCIENCE', label: '사회과학대학' },
  { value: 'LAW', label: '법과대학' },
  { value: 'ECONOMICS', label: '경제대학' },
  { value: 'BUSINESS', label: '경영대학' },
  { value: 'INDEPENDENT', label: '자유전공' },
  { value: 'ENGINEERING', label: '공과대학' },
  { value: 'SOFTWARE', label: '소프트웨어융합대학' },
  { value: 'AUTOMOTIVE', label: '자동차융합대학' },
  { value: 'SCIENCE', label: '과학기술대학' },
  { value: 'ARCHITECTURE', label: '건축대학' },
  { value: 'DESIGN', label: '디자인대학' },
  { value: 'ARTS', label: '예술대학' },
  { value: 'PHYSICAL_EDUCATION', label: '체육대학' },
];

const STATUS_OPTIONS: { value: RecruitmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '모집상태' },
  { value: 'RECRUITING', label: '모집중' },
  { value: 'SCHEDULED', label: '모집예정' },
  { value: 'CLOSED', label: '모집마감' },
];

/** 백엔드 sort 파라미터 값 (스웨거: latest, popularity, viewCount, deadline + 이름순) */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name,asc', label: '이름순' },
  { value: 'popularity', label: '좋아요순' },
  { value: 'latest', label: '최신순' },
  { value: 'viewCount', label: '조회수순' },
  { value: 'deadline', label: '마감순' },
];

type SearchFilterBarProps = {
  placeholder?: string;
  stickyHideOnScroll?: boolean;
  useGlass?: boolean;
  className?: string;
};

export function SearchFilterBar({
  placeholder = '어떤 동아리를 찾으시나요?',
  stickyHideOnScroll = false,
  useGlass = false,
  className = '',
}: SearchFilterBarProps) {
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('ALL'));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault('ALL'));
  const [clubType, setClubType] = useQueryState('clubType', parseAsString.withDefault('ALL'));
  const [college, setCollege] = useQueryState('college', parseAsString.withDefault('ALL'));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('name,asc'));
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [searchInput, setSearchInput] = useState(query);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isDepartmental = clubType === 'DEPARTMENTAL';

  // 과동아리 해제 시 단과대 선택 초기화
  useEffect(() => {
    if (!isDepartmental && college && college !== 'ALL') {
      setCollege('ALL');
    }
  }, [isDepartmental, college, setCollege]);

  useEffect(() => {
    if (!stickyHideOnScroll) return;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) setIsVisible(false);
      else if (currentScrollY < lastScrollY) setIsVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, stickyHideOnScroll]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput || null), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setQuery]);

  const handleCategoryChange = (value: Key | null) => {
    setCategory(value === 'ALL' ? null : (value as string) || null);
  };
  const handleStatusChange = (value: Key | null) => {
    setStatus(value === 'ALL' ? null : (value as string) || null);
  };
  const handleClubTypeChange = (value: Key | null) => {
    setClubType(value === 'ALL' ? null : (value as string) || null);
  };
  const handleCollegeChange = (value: Key | null) => {
    setCollege(value === 'ALL' ? null : (value as string) || null);
  };
  const handleSortChange = (value: Key | null) => {
    setSort((value as string) || 'name,asc');
  };

  const bgClass =
    stickyHideOnScroll || useGlass ? 'glass' : 'bg-[var(--card)]';
  return (
    <div
      className={
        stickyHideOnScroll
          ? `${bgClass} sticky top-14 z-30 border-y-0 px-4 py-2 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full opacity-0'} ${className}`
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
        <Input
          type="text"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full border border-zinc-300 bg-zinc-50 pl-10 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
          aria-label="검색"
        />
      </div>

      {/* 필터: 기본 = 동아리 유형만, 과동아리 선택 시 단과대 추가 노출 */}
      <div className="no-scrollbar flex flex-wrap items-center gap-2 p-1">
        {/* 1. 동아리 유형 (기본 노출) */}
        <Select
          className="shrink-0"
          placeholder="동아리 유형"
          aria-label="동아리 유형 선택"
          selectedKey={clubType || 'ALL'}
          onSelectionChange={(key) => handleClubTypeChange(key ?? 'ALL')}
        >
          <Select.Trigger className="min-w-[100px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200">
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

        {/* 2. 단과대 선택 (과동아리 선택 시에만 노출) */}
        {isDepartmental && (
          <Select
            className="shrink-0"
            placeholder="단과대"
            aria-label="단과대 선택"
            selectedKey={college || 'ALL'}
            onSelectionChange={(key) => handleCollegeChange(key ?? 'ALL')}
          >
            <Select.Trigger className="min-w-[120px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200">
              <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
              <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
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
          selectedKey={category || 'ALL'}
          onSelectionChange={(key) => handleCategoryChange(key ?? 'ALL')}
        >
          <Select.Trigger className="min-w-[72px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200">
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

        {/* 4. 모집상태 */}
        <Select
          className="shrink-0"
          placeholder="상태"
          aria-label="모집상태 선택"
          selectedKey={status || 'ALL'}
          onSelectionChange={(key) => handleStatusChange(key ?? 'ALL')}
        >
          <Select.Trigger className="min-w-[72px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUS_OPTIONS.map((opt) => (
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

        {/* 5. 정렬 (백엔드 sort 파라미터) */}
        <Select
          className="shrink-0"
          placeholder="정렬"
          aria-label="정렬 선택"
          selectedKey={sort || 'name,asc'}
          onSelectionChange={(key) => handleSortChange(key ?? 'name,asc')}
        >
          <Select.Trigger className="min-w-[88px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200">
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
