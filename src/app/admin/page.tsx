'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, Chip, Input, ListBox, Select, Spinner, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useGrantAdmin, useRevokeAdmin, useSystemAdmins } from '@/features/admin';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useAdminApplications } from '@/features/club/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

const STATUS_CHIP: Record<string, { label: string; color: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: '대기', color: 'warning' },
  APPROVED: { label: '승인', color: 'success' },
  REJECTED: { label: '거절', color: 'danger' },
};

function ApplicationList() {
  const [q] = useQueryState('q', parseAsString.withDefault(''));
  const [statusFilter] = useQueryState('status', parseAsString);
  const statusParam =
    statusFilter === 'PENDING' || statusFilter === 'APPROVED' || statusFilter === 'REJECTED'
      ? statusFilter
      : undefined;
  const { data: applications, isLoading } = useAdminApplications(statusParam);
  const list = useMemo(() => applications ?? [], [applications]);
  const filtered = useMemo(
    () =>
      q?.trim()
        ? list.filter((app) => app.name.toLowerCase().includes(q.trim().toLowerCase()))
        : list,
    [list, q]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        <p>{q?.trim() ? '검색 결과가 없습니다.' : '신청이 없습니다.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-3">
        {filtered.map((app) => {
          const chip = STATUS_CHIP[app.status ?? ''] ?? {
            label: app.status ?? '-',
            color: 'warning' as const,
          };
          return (
            <Link
              key={app.id}
              href={`/admin/applications/${app.id}`}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-zinc-800"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
                {app.image ? (
                  <Image
                    src={app.image}
                    alt={app.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <DefaultClubImage className="object-cover" sizes="56px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {app.name}
                    </h4>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      신청자: {app.applicantName || '(이름 없음)'} · {app.applicantEmail}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      신청일: {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Chip size="sm" color={chip.color} variant="soft" className="shrink-0">
                    {chip.label}
                  </Chip>
                </div>
              </div>
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

function AdminSettingsTab() {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const { data: admins = [], isLoading } = useSystemAdmins();
  const grantAdmin = useGrantAdmin();
  const revokeAdmin = useRevokeAdmin();

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim();
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (!email.includes('@')) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (admins.some((a) => a.email === email)) {
      alert('이미 등록된 관리자입니다.');
      return;
    }
    try {
      await grantAdmin.mutateAsync(email);
      setNewAdminEmail('');
      alert('시스템 관리자가 추가되었습니다.');
    } catch {
      // 에러 메시지는 apiClient에서 toast로 표시됨
    }
  };

  const handleRemoveAdmin = async (userId: number, email: string) => {
    if (!confirm(`정말 ${email} 시스템 관리자 권한을 제거하시겠습니까?`)) return;
    try {
      await revokeAdmin.mutateAsync(userId);
      alert('시스템 관리자가 제거되었습니다.');
    } catch {
      // 에러 메시지는 apiClient에서 toast로 표시됨
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          시스템 관리자 추가
        </label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="admin@kookmin.ac.kr"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddAdmin();
              }
            }}
            disabled={grantAdmin.isPending}
          />
          <Button variant="primary" onPress={handleAddAdmin} isDisabled={grantAdmin.isPending}>
            추가
          </Button>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          현재 시스템 관리자 목록
        </label>
        {admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <p>시스템 관리자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.userId}
                className="flex items-center justify-between rounded-xl bg-white p-4 dark:bg-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900 dark:text-zinc-100">
                    {admin.name || admin.email}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {admin.email}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => handleRemoveAdmin(admin.userId, admin.email)}
                  isDisabled={revokeAdmin.isPending}
                >
                  제거
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const REPORT_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'SYSTEM_ERROR', label: '시스템 오류' },
  { value: 'USER_REPORT', label: '유저 신고' },
] as const;

function ReportsTab() {
  const [filter, setFilter] = useState<string>('all');

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          유형 필터
        </label>
        <Select
          selectedKey={filter || 'all'}
          onSelectionChange={(key) => setFilter(key != null ? String(key) : 'all')}
          placeholder="유형 선택"
          className="max-w-xs"
          aria-label="신고 유형 필터"
        >
          <Select.Trigger className="rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {REPORT_FILTER_OPTIONS.map((opt) => (
                <ListBox.Item
                  key={opt.value}
                  id={opt.value}
                  textValue={opt.label}
                  className="text-zinc-900 dark:text-zinc-100"
                >
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        <p>신고 목록이 없습니다.</p>
      </div>
    </div>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('applications'));
  const tabKey =
    tab === 'applications' || tab === 'admins' || tab === 'reports' ? tab : 'applications';
  const [stickyVisible, setStickyVisible] = useState(true);
  const lastScrollY = useRef(0);

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
        onSelectionChange={(key) => setTab(key as string)}
        className="w-full"
      >
        <Tabs.ListContainer
          className={`sticky top-0 z-30 bg-[var(--card)] px-4 pt-3 transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : '-translate-y-full opacity-0'}`}
        >
          <Tabs.List aria-label="관리자 메뉴" className="flex w-full">
            <Tabs.Tab
              id="applications"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              개설 승인
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab
              id="admins"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              관리자 설정
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab
              id="reports"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              신고
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="applications" className="px-3 pt-0">
          <div
            className={`sticky top-14 z-30 bg-[var(--card)] px-0 pb-2 transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : '-translate-y-full opacity-0'}`}
          >
            <SearchFilterBar
              placeholder="동아리명 검색"
              stickyHideOnScroll={false}
              className="!border-0 !px-0"
              applicationStatusFilter
            />
          </div>
          <ApplicationList />
        </Tabs.Panel>
        <Tabs.Panel id="admins" className="pt-0">
          <AdminSettingsTab />
        </Tabs.Panel>
        <Tabs.Panel id="reports" className="pt-0">
          <ReportsTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
