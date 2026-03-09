'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Chip, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useAdminDeletionRequests } from '@/features/club/hooks';
import { useAdminFeedbacks, useCompleteFeedback } from '@/features/feedback/hooks';
import { useAdminReports, useCompleteReport } from '@/features/report/hooks';
import { ListCardSkeleton, PageCenteredSkeleton } from '@/components/common/skeletons';

const REPORT_TYPE_MAP = {
  'system-error': {
    label: '시스템오류(버그신고)',
    api: 'feedback' as const,
    feedbackType: 'BUG_REPORT' as const,
  },
  suggestion: { label: '건의사항', api: 'feedback' as const, feedbackType: 'SUGGESTION' as const },
  'user-report': { label: '동아리 및 유저 신고', api: 'report' as const },
  'delete-request': { label: '삭제 신청', api: 'deletion' as const },
} as const;

const STATUS_TABS_WITH_REJECT = [
  { value: 'pending', label: '대기' },
  { value: 'completed', label: '완료' },
  { value: 'rejected', label: '반려' },
  { value: 'all', label: '전체' },
] as const;

/** 시스템오류, 건의사항, 동아리 및 유저신고에는 반려 탭 없음 */
const STATUS_TABS_NO_REJECT = [
  { value: 'pending', label: '대기' },
  { value: 'completed', label: '완료' },
  { value: 'all', label: '전체' },
] as const;

type StatusTabValue =
  | (typeof STATUS_TABS_WITH_REJECT)[number]['value']
  | (typeof STATUS_TABS_NO_REJECT)[number]['value'];

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

/** 신고 종류 라벨 (카드·상세 공통) */
function getReportTypeLabel(reportType: string): string {
  const map: Record<string, string> = {
    COMMUNITY_COMMENT: '커뮤니티 댓글',
    COMMUNITY_POST: '커뮤니티 게시글',
    QNA: 'Q&A',
    QNA_ANSWER: 'Q&A 답변',
    CLUB: '동아리',
    BUG_REPORT: '시스템오류(버그신고)',
    SUGGESTION: '건의사항',
  };
  return map[reportType] ?? reportType;
}

/** 신고 사유 라벨 */
function getReportReasonLabel(reportReason: string): string {
  const map: Record<string, string> = {
    ABUSE: '욕설·비방',
    SPAM: '스팸',
    ILLEGAL: '불법·부적절한 내용',
    OTHER: '기타',
  };
  return map[reportReason] ?? reportReason;
}

/** 카드: 태그(신고 종류) + 신고 사유 한 줄, 오른쪽 상태 칩 + > 아이콘 */
function ReportCard({
  typeSlug,
  reportId,
  reportType,
  reportReason,
  reasonDetail,
  createdAt,
  status,
}: {
  typeSlug: string;
  reportId: number;
  reportType: string;
  reportReason: string;
  reasonDetail: string | undefined;
  createdAt: string | undefined;
  status: 'PENDING' | 'COMPLETED';
}) {
  const reasonLine = reasonDetail?.trim() || getReportReasonLabel(reportReason);
  return (
    <Link
      href={`/admin/reports/${typeSlug}/${reportId}`}
      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300">
            {getReportTypeLabel(reportType)}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-400">{reasonLine}</p>
        <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDate(createdAt)}
        </div>
      </div>
      <Chip
        size="sm"
        color={status === 'COMPLETED' ? 'success' : 'warning'}
        variant="soft"
        className="shrink-0"
      >
        {status === 'COMPLETED' ? '처리완료' : '대기'}
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
}

/** 피드백(시스템오류/건의) 카드: 왼쪽 제목·날짜, 오른쪽 상태 칩 + > 아이콘 (삭제 신청 카드와 동일한 나열) */
function FeedbackCard({
  typeSlug,
  feedbackId,
  feedbackType,
  createdAt,
  status,
}: {
  typeSlug: string;
  feedbackId: number;
  feedbackType: string;
  createdAt: string | undefined;
  status: 'PENDING' | 'COMPLETED';
}) {
  return (
    <Link
      href={`/admin/reports/${typeSlug}/${feedbackId}`}
      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition-all hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:border-zinc-700"
    >
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {getReportTypeLabel(feedbackType)}
        </h4>
        <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDate(createdAt)}
        </div>
      </div>
      <Chip
        size="sm"
        color={status === 'COMPLETED' ? 'success' : 'warning'}
        variant="soft"
        className="shrink-0"
      >
        {status === 'COMPLETED' ? '처리완료' : '대기'}
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
}

export default function AdminReportTypePage() {
  const router = useRouter();
  const params = useParams();
  const typeSlug = params?.type as string | undefined;
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [statusTab, setStatusTab] = useQueryState('status', parseAsString.withDefault('pending'));
  const [stickyVisible, setStickyVisible] = useState(true);
  const lastScrollY = useRef(0);

  const reportType =
    typeSlug && typeSlug in REPORT_TYPE_MAP
      ? REPORT_TYPE_MAP[typeSlug as keyof typeof REPORT_TYPE_MAP]
      : null;

  /** 삭제 신청만 반려 탭 있음. 그 외는 rejected 선택 시 pending으로 취급 */
  const hasRejectTab = reportType?.api === 'deletion';
  const statusKey: StatusTabValue =
    statusTab === 'pending' ||
    statusTab === 'completed' ||
    (statusTab === 'rejected' && hasRejectTab) ||
    statusTab === 'all'
      ? statusTab
      : 'pending';
  const statusTabs = hasRejectTab ? STATUS_TABS_WITH_REJECT : STATUS_TABS_NO_REJECT;

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

  const _completeReport = useCompleteReport();
  const _completeFeedback = useCompleteFeedback();

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

  const reports = reportType.api === 'report' ? (reportsData?.content ?? []) : [];
  const feedbacks = reportType.api === 'feedback' ? (feedbacksData?.content ?? []) : [];
  const deletions = reportType.api === 'deletion' ? (deletionData?.content ?? []) : [];

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
          <Tabs.List aria-label="처리 상태" className="flex w-full min-w-0">
            {statusTabs.map((opt) => (
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
                <ReportCard
                  key={r.reportId}
                  typeSlug={typeSlug ?? 'user-report'}
                  reportId={r.reportId}
                  reportType={r.reportType}
                  reportReason={r.reportReason}
                  reasonDetail={r.reasonDetail}
                  createdAt={r.createdAt}
                  status={r.status}
                />
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <FeedbackCard
                  key={f.feedbackId}
                  typeSlug={typeSlug ?? 'system-error'}
                  feedbackId={f.feedbackId}
                  feedbackType={f.feedbackType}
                  createdAt={f.createdAt}
                  status={f.status}
                />
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
                  <Chip size="sm" color="warning" variant="soft" className="shrink-0">
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
                <ReportCard
                  key={r.reportId}
                  typeSlug={typeSlug ?? 'user-report'}
                  reportId={r.reportId}
                  reportType={r.reportType}
                  reportReason={r.reportReason}
                  reasonDetail={r.reasonDetail}
                  createdAt={r.createdAt}
                  status={r.status}
                />
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <FeedbackCard
                  key={f.feedbackId}
                  typeSlug={typeSlug ?? 'system-error'}
                  feedbackId={f.feedbackId}
                  feedbackType={f.feedbackType}
                  createdAt={f.createdAt}
                  status={f.status}
                />
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

        {hasRejectTab && (
          <Tabs.Panel id="rejected" className="p-4 pt-0">
            {isLoading ? (
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
        )}

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
                <ReportCard
                  key={r.reportId}
                  typeSlug={typeSlug ?? 'user-report'}
                  reportId={r.reportId}
                  reportType={r.reportType}
                  reportReason={r.reportReason}
                  reasonDetail={r.reasonDetail}
                  createdAt={r.createdAt}
                  status={r.status}
                />
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <FeedbackCard
                  key={f.feedbackId}
                  typeSlug={typeSlug ?? 'system-error'}
                  feedbackId={f.feedbackId}
                  feedbackType={f.feedbackType}
                  createdAt={f.createdAt}
                  status={f.status}
                />
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
                      d.status === 'APPROVED'
                        ? 'success'
                        : d.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
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
