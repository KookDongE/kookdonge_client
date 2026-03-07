'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

import { Chip, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { ListCardSkeleton } from '@/components/common/skeletons';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useAdminDeletionRequests } from '@/features/club/hooks';
import {
  useAdminFeedbacks,
  useCompleteFeedback,
} from '@/features/feedback/hooks';
import {
  useAdminReports,
  useCompleteReport,
} from '@/features/report/hooks';

const REPORT_TYPE_MAP = {
  'system-error': { label: '시스템오류(버그신고)', api: 'feedback' as const, feedbackType: 'BUG_REPORT' as const },
  suggestion: { label: '건의사항', api: 'feedback' as const, feedbackType: 'SUGGESTION' as const },
  'user-report': { label: '동아리 및 유저 신고', api: 'report' as const },
  'delete-request': { label: '삭제 신청', api: 'deletion' as const },
} as const;

const STATUS_TABS = [
  { value: 'pending', label: '대기' },
  { value: 'completed', label: '완료' },
  { value: 'rejected', label: '반려' },
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

function formatDate(s: string | undefined) {
  if (!s) return '-';
  return new Date(s).toLocaleString('ko-KR');
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
    statusTab === 'pending' ||
    statusTab === 'completed' ||
    statusTab === 'rejected' ||
    statusTab === 'all'
      ? statusTab
      : 'pending';

  // API status param
  const reportStatusParam =
    statusKey === 'pending' ? 'PENDING' : statusKey === 'completed' ? 'COMPLETED' : undefined;
  const feedbackStatusParam = reportStatusParam;
  const deletionStatusParam =
    statusKey === 'pending'
      ? 'PENDING'
      : statusKey === 'completed'
        ? 'APPROVED'
        : statusKey === 'rejected'
          ? 'REJECTED'
          : undefined;

  const { data: reportsData, isLoading: reportsLoading } = useAdminReports({
    status: reportStatusParam,
    page: 0,
    size: 50,
    enabled: reportType?.api === 'report',
  });
  const { data: feedbacksData, isLoading: feedbacksLoading } = useAdminFeedbacks({
    status: feedbackStatusParam,
    feedbackType: reportType?.api === 'feedback' ? reportType.feedbackType : undefined,
    page: 0,
    size: 50,
    enabled: reportType?.api === 'feedback',
  });
  const { data: deletionData, isLoading: deletionLoading } = useAdminDeletionRequests(
    reportType?.api === 'deletion' ? deletionStatusParam : undefined,
    { enabled: reportType?.api === 'deletion' }
  );

  const completeReport = useCompleteReport();
  const completeFeedback = useCompleteFeedback();

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

  const isLoading =
    (reportType.api === 'report' && reportsLoading) ||
    (reportType.api === 'feedback' && feedbacksLoading) ||
    (reportType.api === 'deletion' && deletionLoading);

  const reports = reportType.api === 'report' ? reportsData?.content ?? [] : [];
  const feedbacks = reportType.api === 'feedback' ? feedbacksData?.content ?? [] : [];
  const deletions = reportType.api === 'deletion' ? deletionData?.content ?? [] : [];

  const showEmpty =
    (reportType.api === 'report' && reports.length === 0) ||
    (reportType.api === 'feedback' && feedbacks.length === 0) ||
    (reportType.api === 'deletion' && deletions.length === 0);

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
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <ListCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <ReportListPlaceholder typeLabel={reportType.label} statusLabel="대기" />
          ) : reportType.api === 'report' ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.reportId}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      [{r.reportType}] {r.reporterName ?? '-'}
                      {r.reporterEmail != null && r.reporterEmail !== '' && (
                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {r.reporterEmail}</span>
                      )}
                    </p>
                    {(r.reasonDetail ?? r.contentSnapshot) && (
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap">
                        {r.reasonDetail ?? r.contentSnapshot}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(r.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => completeReport.mutate(r.reportId)}
                      disabled={completeReport.isPending}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-blue-400 px-3 text-xs font-medium text-white shadow transition-colors hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {completeReport.isPending ? '처리 중...' : '처리완료'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div
                  key={f.feedbackId}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      [{f.feedbackType}] {f.userName ?? '-'}
                      {f.userEmail != null && f.userEmail !== '' && (
                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {f.userEmail}</span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-4 whitespace-pre-wrap">
                      {f.content}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(f.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => completeFeedback.mutate(f.feedbackId)}
                      disabled={completeFeedback.isPending}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-blue-400 px-3 text-xs font-medium text-white shadow transition-colors hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {completeFeedback.isPending ? '처리 중...' : '처리완료'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map((d) => (
                <Link
                  key={d.requestId}
                  href={`/admin/deletion-requests/${d.requestId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {d.clubName}
                    </h4>
                    <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      신청일: {formatDate(d.createdAt)}
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    color="warning"
                    variant="soft"
                    className="shrink-0"
                  >
                    대기
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
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="completed" className="p-4 pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <ListCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <ReportListPlaceholder typeLabel={reportType.label} statusLabel="완료" />
          ) : reportType.api === 'report' ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.reportId}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      [{r.reportType}] {r.reporterName ?? '-'}
                      {r.reporterEmail != null && r.reporterEmail !== '' && (
                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {r.reporterEmail}</span>
                      )}
                    </p>
                    {(r.reasonDetail ?? r.contentSnapshot) && (
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap">
                        {r.reasonDetail ?? r.contentSnapshot}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(r.createdAt)}
                    </p>
                    <Chip size="sm" color="success" variant="soft">
                      완료
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div
                  key={f.feedbackId}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      [{f.feedbackType}] {f.userName ?? '-'}
                      {f.userEmail != null && f.userEmail !== '' && (
                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {f.userEmail}</span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-4 whitespace-pre-wrap">
                      {f.content}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(f.createdAt)}
                    </p>
                    <Chip size="sm" color="success" variant="soft">
                      완료
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map((d) => (
                <Link
                  key={d.requestId}
                  href={`/admin/deletion-requests/${d.requestId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {d.clubName}
                    </h4>
                    <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      승인: {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <Chip size="sm" color="success" variant="soft" className="shrink-0">
                    승인
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
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="rejected" className="p-4 pt-0">
          {reportType.api !== 'deletion' ? (
            <ReportListPlaceholder typeLabel={reportType.label} statusLabel="반려" />
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <ListCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <ReportListPlaceholder typeLabel={reportType.label} statusLabel="반려" />
          ) : (
            <div className="space-y-3">
              {deletions.map((d) => (
                <Link
                  key={d.requestId}
                  href={`/admin/deletion-requests/${d.requestId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {d.clubName}
                    </h4>
                    <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      거절: {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <Chip size="sm" color="danger" variant="soft" className="shrink-0">
                    거절
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
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="all" className="p-4 pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <ListCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <ReportListPlaceholder typeLabel={reportType.label} statusLabel="전체" />
          ) : reportType.api === 'report' ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.reportId}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      [{r.reportType}] {r.reporterName ?? '-'}
                      {r.reporterEmail != null && r.reporterEmail !== '' && (
                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {r.reporterEmail}</span>
                      )}
                    </p>
                    {(r.reasonDetail ?? r.contentSnapshot) && (
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap">
                        {r.reasonDetail ?? r.contentSnapshot}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(r.createdAt)}
                    </p>
                    <Chip size="sm" color={r.status === 'COMPLETED' ? 'success' : 'warning'} variant="soft">
                      {r.status === 'COMPLETED' ? '완료' : '대기'}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div
                  key={f.feedbackId}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      [{f.feedbackType}] {f.userName ?? '-'}
                      {f.userEmail != null && f.userEmail !== '' && (
                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">· {f.userEmail}</span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-4 whitespace-pre-wrap">
                      {f.content}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(f.createdAt)}
                    </p>
                    <Chip size="sm" color={f.status === 'COMPLETED' ? 'success' : 'warning'} variant="soft">
                      {f.status === 'COMPLETED' ? '완료' : '대기'}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map((d) => (
                <Link
                  key={d.requestId}
                  href={`/admin/deletion-requests/${d.requestId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                      {d.clubName}
                    </h4>
                    <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      신청일: {formatDate(d.createdAt)}
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    color={
                      d.status === 'APPROVED' ? 'success' : d.status === 'REJECTED' ? 'danger' : 'warning'
                    }
                    variant="soft"
                    className="shrink-0"
                  >
                    {d.status === 'PENDING' ? '대기' : d.status === 'APPROVED' ? '승인' : '거절'}
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
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
