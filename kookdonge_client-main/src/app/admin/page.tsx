'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Button, Chip, Input, Spinner, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useAdminApplications } from '@/features/club/hooks';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

function ApplicationManagementTab({
  stickyVisible = true,
  filterStickyClass = '',
}: {
  stickyVisible?: boolean;
  filterStickyClass?: string;
} = {}) {
  const [q] = useQueryState('q', parseAsString.withDefault(''));
  const { data: applications, isLoading } = useAdminApplications();
  const pending = useMemo(() => applications?.filter((app) => app.status === 'PENDING') ?? [], [applications]);
  const filtered = useMemo(
    () =>
      q?.trim()
        ? pending.filter((app) => app.name.toLowerCase().includes(q.trim().toLowerCase()))
        : pending,
    [pending, q]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className={`glass sticky top-[7.5rem] z-20 border-b-0 ${filterStickyClass}`}>
        <SearchFilterBar
          placeholder="동아리명 검색"
          stickyHideOnScroll={false}
          useGlass
          className="!border-b-0"
        />
      </div>
      <div className="space-y-4 p-4">
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>{q?.trim() ? '검색 결과가 없습니다.' : '대기 중인 신청이 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link
              key={app.id}
              href={`/admin/applications/${app.id}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
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
                  <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-400 dark:text-zinc-500">
                    🏠
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">{app.name}</h4>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      신청일: {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Chip size="sm" color="warning" variant="soft" className="shrink-0">
                    승인 대기
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
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function AdminSettingsTab() {
  // 시스템 관리자 목록 (더미 데이터)
  const [systemAdmins, setSystemAdmins] = useState<string[]>([
    'admin@kookmin.ac.kr',
    'superadmin@kookmin.ac.kr',
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (!newAdminEmail.includes('@')) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (systemAdmins.includes(newAdminEmail.trim())) {
      alert('이미 등록된 관리자입니다.');
      return;
    }

    setSystemAdmins([...systemAdmins, newAdminEmail.trim()]);
    setNewAdminEmail('');
    alert('시스템 관리자가 추가되었습니다.');
  };

  const handleRemoveAdmin = (email: string) => {
    if (confirm(`정말 ${email} 시스템 관리자 권한을 제거하시겠습니까?`)) {
      setSystemAdmins(systemAdmins.filter((e) => e !== email));
      alert('시스템 관리자가 제거되었습니다.');
    }
  };

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
          />
          <Button color="primary" onPress={handleAddAdmin}>
            추가
          </Button>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          현재 시스템 관리자 목록
        </label>
        {systemAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>시스템 관리자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {systemAdmins.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{email}</span>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleRemoveAdmin(email)}
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

export default function AdminPage() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('applications'));
  const [isStickyVisible, setIsStickyVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsStickyVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsStickyVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const isApplicationsTab = (tab || 'applications') === 'applications';
  const stickyTransitionClass = `transition-transform duration-300 ${
    isStickyVisible ? 'translate-y-0' : '-translate-y-full opacity-0'
  }`;

  return (
    <div className="bg-white dark:bg-white min-h-screen pb-20">
      <Tabs
        selectedKey={tab || 'applications'}
        onSelectionChange={(key) => setTab(key as string)}
        className="w-full"
      >
        <Tabs.ListContainer
          className={`glass sticky top-20 z-30 border-b-0 px-4 ${stickyTransitionClass}`}
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
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="applications">
          <ApplicationManagementTab
            stickyVisible={isStickyVisible}
            filterStickyClass={stickyTransitionClass}
          />
        </Tabs.Panel>
        <Tabs.Panel id="admins">
          <AdminSettingsTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
