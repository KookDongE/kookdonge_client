'use client';

import { useEffect, useState, type Key } from 'react';

import { Input, ListBox, Select } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubType, RecruitmentStatus } from '@/types/api';

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

const STATUS_OPTIONS: { value: RecruitmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '상태' },
  { value: 'RECRUITING', label: '모집중' },
  { value: 'SCHEDULED', label: '모집예정' },
  { value: 'CLOSED', label: '모집마감' },
];

type SearchFilterBarProps = {
  placeholder?: string;
  /** 스크롤 시 숨김 (홈용). false면 항상 표시 */
  stickyHideOnScroll?: boolean;
  /** 헤더처럼 반투명(glass) 배경 사용 (관리자 탭 등) */
  useGlass?: boolean;
  /** 검색+필터 영역 클래스 */
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
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [searchInput, setSearchInput] = useState(query);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  const bgClass =
    stickyHideOnScroll || useGlass ? 'glass' : 'bg-[var(--card)]';
  return (
    <div
      className={
        stickyHideOnScroll
          ? `${bgClass} sticky top-20 z-30 border-y-0 px-4 py-3 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full opacity-0'} ${className}`
          : `border-b border-zinc-200 ${bgClass} px-4 py-3 dark:border-zinc-700 ${className}`
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
      <div className="no-scrollbar flex gap-2 overflow-x-auto p-1">
        <Select
          className="shrink-0"
          placeholder="분야"
          aria-label="분야 선택"
          value={category || undefined}
          onChange={handleCategoryChange}
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
        <Select
          className="shrink-0"
          placeholder="상태"
          aria-label="상태 선택"
          value={status || undefined}
          onChange={handleStatusChange}
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
        <Select
          className="shrink-0"
          placeholder="단과대"
          aria-label="단과대 선택"
          value={clubType || undefined}
          onChange={handleClubTypeChange}
        >
          <Select.Trigger className="min-w-[88px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item
                key="ALL"
                id="ALL"
                textValue="단과대"
                className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
              >
                단과대
              </ListBox.Item>
              <ListBox.Item
                key="DEPARTMENTAL"
                id="DEPARTMENTAL"
                textValue="단과대별"
                className="flex items-center justify-center text-center !text-zinc-600 dark:!text-zinc-200"
              >
                단과대별
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  );
}
