'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

import { Button, Chip, Tabs, TextArea } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { PageCenteredSkeleton } from '@/components/common/skeletons';
import { ListCardSkeleton } from '@/components/common/skeletons';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import {
  useAdminDeletionRequests,
  useApproveDeletionRequest,
  useRejectDeletionRequest,
} from '@/features/club/hooks';
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
  const approveDeletion = useApproveDeletionRequest();
  const rejectDeletion = useRejectDeletionRequest();

  const [rejectModal, setRejectModal] = useState<{
    requestId: number;
    clubName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const handleRejectSubmit = () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해 주세요.');
      return;
    }
    rejectDeletion.mutate(
      { requestId: rejectModal.requestId, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectModal(null);
          setRejectReason('');
        },
      }
    );
  };

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
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        [{r.reportType}] contentId: {r.contentId}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        신고자: {r.reporterName ?? '-'} · {formatDate(r.createdAt)}
                      </p>
                      {r.reasonDetail && (
                        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                          {r.reasonDetail}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => completeReport.mutate(r.reportId)}
                      isDisabled={completeReport.isPending}
                    >
                      처리완료
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : reportType.api === 'feedback' ? (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div
                  key={f.feedbackId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        [{f.feedbackType}] {f.userName ?? '-'}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(f.createdAt)}
                      </p>
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
                        {f.content}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => completeFeedback.mutate(f.feedbackId)}
                      isDisabled={completeFeedback.isPending}
                    >
                      처리완료
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map((d) => (
                <div
                  key={d.requestId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {d.clubName} (clubId: {d.clubId})
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      신청자: {d.requesterName ?? '-'} · {formatDate(d.createdAt)}
                    </p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      사유: {d.deletionReason}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onPress={() =>
                          window.confirm(`"${d.clubName}" 삭제를 승인하시겠습니까?`) &&
                          approveDeletion.mutate(d.requestId)
                        }
                        isDisabled={approveDeletion.isPending}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onPress={() => setRejectModal({ requestId: d.requestId, clubName: d.clubName })}
                        isDisabled={rejectDeletion.isPending}
                      >
                        거절
                      </Button>
                    </div>
                  </div>
                </div>
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
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        [{r.reportType}] contentId: {r.contentId}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(r.createdAt)} · 처리: {formatDate(r.processedAt)}
                      </p>
                    </div>
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
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        [{f.feedbackType}] {f.userName ?? '-'}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(f.processedAt)}
                      </p>
                    </div>
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
                <div
                  key={d.requestId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {d.clubName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        승인: {formatDate(d.updatedAt)}
                      </p>
                    </div>
                    <Chip size="sm" color="success" variant="soft">
                      승인됨
                    </Chip>
                  </div>
                </div>
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
                <div
                  key={d.requestId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {d.clubName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    거절: {formatDate(d.updatedAt)} · {d.rejectionReason ?? ''}
                  </p>
                  <Chip size="sm" color="danger" variant="soft" className="mt-2">
                    거절됨
                  </Chip>
                </div>
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
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        [{r.reportType}] contentId: {r.contentId}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
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
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        [{f.feedbackType}] {f.userName ?? '-'}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(f.createdAt)}
                      </p>
                    </div>
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
                <div
                  key={d.requestId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {d.clubName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(d.createdAt)}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      color={
                        d.status === 'APPROVED' ? 'success' : d.status === 'REJECTED' ? 'danger' : 'warning'
                      }
                      variant="soft"
                    >
                      {d.status === 'PENDING' ? '대기' : d.status === 'APPROVED' ? '승인' : '거절'}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* 거절 사유 모달 */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-4 dark:bg-zinc-800">
            <h2 id="reject-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              삭제 신청 반려
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {rejectModal.clubName}
            </p>
            <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              반려 사유
            </label>
            <TextArea
              placeholder="반려 사유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1 min-h-[6rem]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onPress={() => { setRejectModal(null); setRejectReason(''); }}>
                취소
              </Button>
              <Button
                variant="danger"
                onPress={handleRejectSubmit}
                isDisabled={!rejectReason.trim() || rejectDeletion.isPending}
                isPending={rejectDeletion.isPending}
              >
                반려
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
