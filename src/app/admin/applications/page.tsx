'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Chip, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useAdminApplications } from '@/features/club/hooks';
import { ListCardSkeleton, PageCenteredSkeleton } from '@/components/common/skeletons';

const STATUS_CHIP: Record<string, { label: string; color: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: '대기', color: 'warning' },
  APPROVED: { label: '승인', color: 'success' },
  REJECTED: { label: '반려', color: 'danger' },
};

type ApplicationStatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const APPLICATION_TABS: { value: ApplicationStatusFilter; label: string }[] = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'ALL', label: '전체' },
];

function ApplicationList({ statusParam }: { statusParam?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const { data: applications, isLoading } = useAdminApplications(statusParam);
  const list = useMemo(() => applications ?? [], [applications]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <ListCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        <p>신청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-3">
        {list.map((app) => {
          const chip = STATUS_CHIP[app.status ?? ''] ?? {
            label: app.status ?? '-',
            color: 'warning' as const,
          };
          return (
            <Link
              key={app.id}
              href={`/admin/applications/${app.id}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
            >
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                  {app.name}
                </h4>
                <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  신청일: {new Date(app.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <Chip size="sm" color={chip.color} variant="soft" className="shrink-0">
                {chip.label}
              </Chip>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [statusTab, setStatusTab] = useQueryState('status', parseAsString.withDefault('PENDING'));
  const [stickyVisible, setStickyVisible] = useState(true);
  const lastScrollY = useRef(0);

  const tabKey =
    statusTab === 'PENDING' ||
    statusTab === 'APPROVED' ||
    statusTab === 'REJECTED' ||
    statusTab === 'ALL'
      ? statusTab
      : 'PENDING';
  const _statusParam: 'PENDING' | 'APPROVED' | 'REJECTED' | undefined =
    statusTab === 'ALL' ? undefined : (statusTab as 'PENDING' | 'APPROVED' | 'REJECTED');

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    const scrollEl =
      scrollContainerRef.current ??
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
        <PageCenteredSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto pb-20">
        <Tabs
          selectedKey={tabKey}
          onSelectionChange={(key) => setStatusTab(key as ApplicationStatusFilter)}
          className="w-full"
        >
          <Tabs.ListContainer
            className={`sticky top-0 z-30 bg-[var(--card)] px-4 pt-3 transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : '-translate-y-full opacity-0'}`}
          >
            <Tabs.List aria-label="승인 상태" className="flex w-full min-w-0">
              {APPLICATION_TABS.map((opt) => (
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

          <Tabs.Panel id="PENDING" className="pt-0">
            <ApplicationList statusParam="PENDING" />
          </Tabs.Panel>
          <Tabs.Panel id="APPROVED" className="pt-0">
            <ApplicationList statusParam="APPROVED" />
          </Tabs.Panel>
          <Tabs.Panel id="REJECTED" className="pt-0">
            <ApplicationList statusParam="REJECTED" />
          </Tabs.Panel>
          <Tabs.Panel id="ALL" className="pt-0">
            <ApplicationList statusParam={undefined} />
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}
