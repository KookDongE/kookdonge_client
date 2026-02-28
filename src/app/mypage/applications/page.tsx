'use client';

import { Suspense } from 'react';
import Image from 'next/image';

import { Chip, Spinner } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useMyApplications } from '@/features/club/hooks';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

function MyApplicationsListContent() {
  const [q] = useQueryState('q', parseAsString.withDefault(''));
  const { data: applications, isLoading } = useMyApplications();

  const list = applications || [];
  const filtered = q
    ? list.filter((app) => app.name.toLowerCase().includes(q.trim().toLowerCase()))
    : list;

  return (
    <div className="pb-6">
      <SearchFilterBar stickyHideOnScroll placeholder="동아리명 검색" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>{q ? '검색 결과가 없습니다.' : '신청한 동아리가 없습니다.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {app.image ? (
                    <Image
                      src={app.image}
                      alt={app.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="h-full w-full bg-zinc-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold text-zinc-800">{app.name}</h4>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                        신청일: {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      color={
                        app.status === 'PENDING'
                          ? 'warning'
                          : app.status === 'APPROVED'
                            ? 'success'
                            : 'danger'
                      }
                      variant="soft"
                      className="shrink-0"
                    >
                      {app.status === 'PENDING'
                        ? '대기중'
                        : app.status === 'APPROVED'
                          ? '승인됨'
                          : '거절됨'}
                    </Chip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyApplicationsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <MyApplicationsListContent />
    </Suspense>
  );
}
