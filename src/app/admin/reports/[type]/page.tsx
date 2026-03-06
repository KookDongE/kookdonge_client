'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

import { Tabs } from '@heroui/react';

import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { parseAsString, useQueryState } from 'nuqs';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';

const REPORT_TYPE_MAP = {
  'system-error': { label: '시스템오류', value: 'SYSTEM_ERROR' },
  suggestion: { label: '건의사항', value: 'SUGGESTION' },
  'user-report': { label: '동아리 및 유저 신고', value: 'USER_REPORT' },
  'delete-request': { label: '삭제 신청', value: 'DELETE_REQUEST' },
} as const;

const STATUS_TABS = [
  { value: 'pending', label: '대기' },
  { value: 'completed', label: '완료' },
  { value: 'all', label: '전체' },
] as const;

type StatusTabValue = (typeof STATUS_TABS)[number]['value'];

function ReportListPlaceholder({
  typeLabel,
  statusLabel,
}: {
  typeLabel: string;
  statusLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
      <p>
        {typeLabel} · {statusLabel} 목록이 없습니다.
      </p>
    </div>
  );
}

export default function AdminReportTypePage() {
  const router = useRouter();
  const params = useParams();
  const typeSlug = params?.type as string | undefined;
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [statusTab, setStatusTab] = useQueryState(
    'status',
    parseAsString.withDefault('pending')
  );
  const [stickyVisible, setStickyVisible] = useState(true);
  const lastScrollY = useRef(0);

  const reportType =
    typeSlug && typeSlug in REPORT_TYPE_MAP
      ? REPORT_TYPE_MAP[typeSlug as keyof typeof REPORT_TYPE_MAP]
      : null;

  const statusKey: StatusTabValue =
    statusTab === 'pending' || statusTab === 'completed' || statusTab === 'all'
      ? statusTab
      : 'pending';

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (!reportType) return;
    const scrollEl =
      document.querySelector('[data-scroll-container]') ??
      document.querySelector('main') ??
      document.documentElement;
    const getScrollY = () =>
      scrollEl === document.documentElement ? window.scrollY : (scrollEl as HTMLElement).scrollTop;
    const handleScroll = () => {
      const current = getScrollY();
      if (current > lastScrollY.current && current > 60) setStickyVisible(false);
      else if (current < lastScrollY.current) setStickyVisible(true);
      lastScrollY.current = current;
    };
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [reportType]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageCenteredSkeleton />
      </div>
    );
  }

  if (!reportType) {
    return (
      <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-zinc-500 dark:text-zinc-400">잘못된 신고 유형입니다.</p>
          <Link
            href="/admin"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            관리자로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <Tabs
        selectedKey={statusKey}
        onSelectionChange={(key) => setStatusTab(key as StatusTabValue)}
        className="w-full"
      >
        <Tabs.ListContainer
          className={`sticky top-0 z-30 bg-[var(--card)] px-4 pt-3 transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : '-translate-y-full opacity-0'}`}
        >
          <Tabs.List
            aria-label="처리 상태"
            className="flex w-full min-w-0"
          >
            {STATUS_TABS.map((opt) => (
              <Tabs.Tab
                key={opt.value}
                id={opt.value}
                className="min-w-0 flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {opt.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="pending" className="p-4 pt-0">
          <ReportListPlaceholder typeLabel={reportType.label} statusLabel="대기" />
        </Tabs.Panel>
        <Tabs.Panel id="completed" className="p-4 pt-0">
          <ReportListPlaceholder typeLabel={reportType.label} statusLabel="완료" />
        </Tabs.Panel>
        <Tabs.Panel id="all" className="p-4 pt-0">
          <ReportListPlaceholder typeLabel={reportType.label} statusLabel="전체" />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
