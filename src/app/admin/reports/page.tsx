'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

import { Spinner, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';

const REPORT_TABS = [
  { value: 'SYSTEM_ERROR', label: '시스템오류' },
  { value: 'SUGGESTION', label: '건의사항' },
  { value: 'USER_REPORT', label: '유저신고' },
] as const;

type ReportTabValue = (typeof REPORT_TABS)[number]['value'];

function ReportListPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
      <p>{label} 목록이 없습니다.</p>
    </div>
  );
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [reportTab, setReportTab] = useQueryState(
    'type',
    parseAsString.withDefault('SYSTEM_ERROR')
  );
  const [stickyVisible, setStickyVisible] = useState(true);
  const lastScrollY = useRef(0);

  const tabKey: ReportTabValue =
    reportTab === 'SYSTEM_ERROR' || reportTab === 'SUGGESTION' || reportTab === 'USER_REPORT'
      ? reportTab
      : 'SYSTEM_ERROR';

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
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
  }, []);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <Tabs
        selectedKey={tabKey}
        onSelectionChange={(key) => setReportTab(key as ReportTabValue)}
        className="w-full"
      >
        <Tabs.ListContainer
          className={`sticky top-0 z-30 bg-[var(--card)] px-4 pt-3 transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : '-translate-y-full opacity-0'}`}
        >
          <Tabs.List
            aria-label="신고 유형"
            className="flex w-full min-w-0"
          >
            {REPORT_TABS.map((opt) => (
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

        <Tabs.Panel id="SYSTEM_ERROR" className="p-4 pt-0">
          <ReportListPlaceholder label="시스템오류" />
        </Tabs.Panel>
        <Tabs.Panel id="SUGGESTION" className="p-4 pt-0">
          <ReportListPlaceholder label="건의사항" />
        </Tabs.Panel>
        <Tabs.Panel id="USER_REPORT" className="p-4 pt-0">
          <ReportListPlaceholder label="유저신고" />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
