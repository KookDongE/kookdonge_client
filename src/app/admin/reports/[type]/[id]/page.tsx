'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@heroui/react';

import type { ReportType } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useClubDetail } from '@/features/club/hooks';
import { useAdminFeedbackDetail, useCompleteFeedback } from '@/features/feedback/hooks';
import {
  useAdminReportDetail,
  useCompleteReport,
  useReportedContent,
} from '@/features/report/hooks';
import { InterestedClubCard } from '@/components/club/interested-club-card';
import { FormPageSkeleton, PageCenteredSkeleton } from '@/components/common/skeletons';

const REPORT_TYPES: ReportType[] = [
  'QNA',
  'QNA_ANSWER',
  'CLUB',
  'COMMUNITY_POST',
  'COMMUNITY_COMMENT',
];
function asReportType(value: unknown): ReportType | undefined {
  return typeof value === 'string' && REPORT_TYPES.includes(value as ReportType)
    ? (value as ReportType)
    : undefined;
}

const REPORT_TYPE_MAP = {
  'system-error': { label: '시스템오류(버그신고)', api: 'feedback' as const },
  suggestion: { label: '건의사항', api: 'feedback' as const },
  'user-report': { label: '동아리 및 유저 신고', api: 'report' as const },
} as const;

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

function formatDate(s: string | undefined) {
  if (!s) return '-';
  return new Date(s).toLocaleString('ko-KR');
}

type PageProps = { params: Promise<{ type: string; id: string }> };

export default function AdminReportDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const urlParams = useParams();
  const typeSlug = (urlParams?.type ?? resolvedParams?.type) as string | undefined;
  const idParam = (urlParams?.id ?? resolvedParams?.id) as string | undefined;
  const id = idParam ? parseInt(idParam, 10) : NaN;

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const reportTypeInfo =
    typeSlug && typeSlug in REPORT_TYPE_MAP
      ? REPORT_TYPE_MAP[typeSlug as keyof typeof REPORT_TYPE_MAP]
      : null;

  const isReport = reportTypeInfo?.api === 'report';
  const { data: report, isLoading: reportLoading } = useAdminReportDetail(
    id,
    isReport && !Number.isNaN(id)
  );
  const raw = report as Record<string, unknown> | undefined;
  const serverContent =
    (typeof raw?.originalContent === 'string' && raw.originalContent.trim()) ||
    (typeof raw?.original_content === 'string' && raw.original_content.trim()) ||
    (typeof report?.originalContent === 'string' && report.originalContent.trim()) ||
    (typeof raw?.content_snapshot === 'string' && raw.content_snapshot.trim()) ||
    (report?.contentSnapshot?.trim() && report.contentSnapshot.trim()) ||
    '';
  const needFetchContent = isReport && report && !serverContent && report?.reportType !== 'CLUB';
  const rawContentId = report?.contentId ?? (report as Record<string, unknown>)?.content_id;
  const reportContentId =
    typeof rawContentId === 'number' && Number.isFinite(rawContentId) ? rawContentId : undefined;
  const reportTypeValue =
    report?.reportType ?? asReportType((report as Record<string, unknown>)?.report_type);
  const {
    content: fetchedContent,
    isLoading: contentLoading,
    isError: contentError,
  } = useReportedContent(reportTypeValue, reportContentId, !!needFetchContent);
  const clubIdForCard =
    isReport && reportTypeValue === 'CLUB' && reportContentId ? reportContentId : 0;
  const { data: reportedClub } = useClubDetail(clubIdForCard);
  const { data: feedback, isLoading: feedbackLoading } = useAdminFeedbackDetail(
    id,
    !isReport && !Number.isNaN(id)
  );

  const completeReport = useCompleteReport();
  const completeFeedback = useCompleteFeedback();

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <PageCenteredSkeleton />
      </div>
    );
  }

  if (!reportTypeInfo || !typeSlug || Number.isNaN(id)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--card)] p-4">
        <p className="text-[var(--muted-foreground)]">잘못된 경로입니다.</p>
        <Link href="/admin/reports">
          <Button className="mt-4" variant="ghost">
            목록으로
          </Button>
        </Link>
      </div>
    );
  }

  const isLoading = isReport ? reportLoading : feedbackLoading;
  const labelClass = 'mb-2 block text-xs font-normal text-[var(--muted-foreground)]';
  const valueBoxClass =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--card-foreground)]';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <FormPageSkeleton />
      </div>
    );
  }

  /** 유저 신고 상세 */
  if (isReport) {
    if (!report) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--card)] p-4">
          <p className="text-[var(--muted-foreground)]">신고 내역을 찾을 수 없습니다.</p>
          <Link href={`/admin/reports/${typeSlug}`}>
            <Button className="mt-4" variant="ghost">
              목록으로
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--card)]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 p-4 pb-24">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className={labelClass}>신고 종류</label>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(report.createdAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${report.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}
                  >
                    {report.status === 'COMPLETED' ? '처리완료' : '대기'}
                  </span>
                </div>
              </div>
              <div className={valueBoxClass}>{getReportTypeLabel(report.reportType)}</div>
            </div>

            {/* 원글 작성자 (신고 대상) */}
            {(report.targetUserName != null || report.targetUserEmail != null) && (
              <div>
                <label className={labelClass}>원글 작성자</label>
                <div className={valueBoxClass}>
                  {report.targetUserName ?? '(이름 없음)'} · {report.targetUserEmail ?? '-'}
                </div>
              </div>
            )}

            {/* 원글 내용 (신고당한 글) - 스웨거: originalContent(원본 내용) 우선, 동아리는 카드 */}
            {reportTypeValue === 'CLUB' ? (
              <div>
                <label className={labelClass}>신고된 동아리</label>
                {reportContentId ? (
                  <InterestedClubCard
                    subscription={{
                      clubId: reportContentId,
                      clubName: reportedClub?.name ?? '',
                      clubProfileImageUrl: reportedClub?.image ?? '',
                      clubType: reportedClub?.type ?? 'CENTRAL',
                    }}
                    className="mypage-club-card"
                  />
                ) : (
                  <div className={valueBoxClass}>(동아리 정보 없음)</div>
                )}
              </div>
            ) : (
              <div>
                <label className={labelClass}>원글 내용</label>
                <div
                  className={`${valueBoxClass} max-h-[320px] min-h-[120px] overflow-y-auto break-words whitespace-pre-wrap`}
                  role="article"
                >
                  {serverContent
                    ? serverContent
                    : contentLoading
                      ? '원글 조회 중...'
                      : contentError
                        ? '원글 조회에 실패했습니다. (삭제된 글이거나 권한이 없을 수 있습니다.)'
                        : fetchedContent && fetchedContent.trim() !== ''
                          ? fetchedContent
                          : reportTypeValue === 'COMMUNITY_COMMENT'
                            ? '댓글 신고는 서버에서 저장한 원본 내용(originalContent)만 표시됩니다. 없으면 여기 비어 있습니다.'
                            : '(원글 내용 없음)'}
                </div>
              </div>
            )}

            {/* 신고 사유/내용 */}
            {report.reasonDetail != null && report.reasonDetail !== '' && (
              <div>
                <label className={labelClass}>신고 사유</label>
                <div className={`${valueBoxClass} min-h-[80px] whitespace-pre-wrap`}>
                  {report.reasonDetail}
                </div>
              </div>
            )}

            {/* 신고자 */}
            {(report.reporterName != null || report.reporterEmail != null) && (
              <div>
                <label className={labelClass}>신고자</label>
                <div className={valueBoxClass}>
                  {report.reporterName ?? '(이름 없음)'} · {report.reporterEmail ?? '-'}
                </div>
              </div>
            )}

            {report.status === 'PENDING' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    completeReport.mutate(report.reportId, {
                      onSuccess: () => router.back(),
                    })
                  }
                  disabled={completeReport.isPending}
                  className="w-full rounded-lg bg-blue-400 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {completeReport.isPending ? '처리 중...' : '처리완료'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /** 시스템오류/건의사항(피드백) 상세 */
  if (!feedback) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--card)] p-4">
        <p className="text-[var(--muted-foreground)]">내역을 찾을 수 없습니다.</p>
        <Link href={`/admin/reports/${typeSlug}`}>
          <Button className="mt-4" variant="ghost">
            목록으로
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--card)]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 p-4 pb-24">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className={labelClass}>신고 종류</label>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDate(feedback.createdAt)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${feedback.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}
                >
                  {feedback.status === 'COMPLETED' ? '처리완료' : '대기'}
                </span>
              </div>
            </div>
            <div className={valueBoxClass}>{getReportTypeLabel(feedback.feedbackType)}</div>
          </div>

          {/* 작성자 (건의/버그 신고자) */}
          {(feedback.userName != null || feedback.userEmail != null) && (
            <div>
              <label className={labelClass}>작성자</label>
              <div className={valueBoxClass}>
                {feedback.userName ?? '(이름 없음)'} · {feedback.userEmail ?? '-'}
              </div>
            </div>
          )}

          {/* 내용 */}
          <div>
            <label className={labelClass}>내용</label>
            <div className={`${valueBoxClass} min-h-[120px] whitespace-pre-wrap`}>
              {feedback.content}
            </div>
          </div>

          {feedback.status === 'PENDING' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  completeFeedback.mutate(feedback.feedbackId, {
                    onSuccess: () => router.back(),
                  })
                }
                disabled={completeFeedback.isPending}
                className="w-full rounded-lg bg-blue-400 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {completeFeedback.isPending ? '처리 중...' : '처리완료'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
