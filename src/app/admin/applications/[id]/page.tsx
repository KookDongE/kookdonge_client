'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';

import type { ClubCategory, ClubType } from '@/types/api';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { clubApi } from '@/features/club/api';
import {
  clubKeys,
  useAdminApplication,
  useApproveApplication,
  useRejectApplication,
} from '@/features/club/hooks';
import { FormPageSkeleton } from '@/components/common/skeletons';

const CATEGORY_LABELS: Record<ClubCategory, string> = {
  PERFORMING_ARTS: '공연',
  LIBERAL_ARTS_SERVICE: '봉사',
  EXHIBITION_ARTS: '전시',
  RELIGION: '종교',
  BALL_LEISURE: '구기',
  PHYSICAL_MARTIAL_ARTS: '체육',
  ACADEMIC: '학술',
};

const TYPE_LABELS: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학술동아리',
  CLUB: '동아리',
};

const STATUS_CHIP_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

/** 헤더용: yy.MM.dd HH:mm (초 생략) */
function formatDateTimeNoSeconds(isoString: string): string {
  const d = new Date(isoString);
  const yy = d.getFullYear().toString().slice(-2);
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${yy}.${MM}.${dd} ${HH}:${mm}`;
}

type PageProps = { params: Promise<{ id: string }> };

export default function AdminApplicationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const applicationId = parseInt(id, 10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: application, isLoading } = useAdminApplication(applicationId);
  const approveApplication = useApproveApplication();
  const rejectApplication = useRejectApplication();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  if (!id || Number.isNaN(applicationId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-zinc-400">잘못된 경로입니다.</p>
        <Button className="mt-4" variant="ghost" onPress={() => router.push('/admin/applications')}>
          목록으로
        </Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-zinc-400">신청을 찾을 수 없습니다.</p>
        <Button className="mt-4" variant="ghost" onPress={() => router.push('/admin/applications')}>
          목록으로
        </Button>
      </div>
    );
  }

  const isPending = application.status === 'PENDING';

  const handleApprove = () => {
    approveApplication.mutate(applicationId, {
      onSuccess: async () => {
        try {
          const updated = await queryClient.fetchQuery({
            queryKey: [...clubKeys.all, 'admin', 'application', applicationId],
            queryFn: () => clubApi.getApplicationById(applicationId),
          });
          if (updated?.clubId != null) {
            await clubApi.updateClubInfo(updated.clubId, { description: '' });
          }
        } catch {
          // refetch 실패 또는 한줄소개 초기화 실패 시에도 승인 완료 처리
        }
        alert('신청이 승인되었습니다.');
        router.push('/admin/applications');
      },
    });
  };

  const handleRejectClick = () => {
    setShowRejectInput(true);
  };

  const handleRejectSubmit = () => {
    rejectApplication.mutate(
      { applicationId, reason: rejectReason.trim() || '사유 없음' },
      {
        onSuccess: () => {
          alert('신청이 거절되었습니다.');
          router.push('/admin/applications');
        },
      }
    );
  };

  const labelClass =
    'mb-2 block text-xs font-normal text-gray-500 dark:text-zinc-400';
  const valueBoxClass =
    'w-full rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* 헤더: my/club-requests/[id]와 동일 — 뒤로가기(좌) | 날짜·상태 뱃지(우) */}
      <div className="shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-base font-medium text-gray-700 dark:text-zinc-200"
          >
            <span className="inline-block">←</span>
            <span>뒤로가기</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {formatDateTimeNoSeconds(application.createdAt)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CHIP_CLASS[application.status] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'}`}
            >
              {application.status === 'PENDING'
                ? '승인 대기'
                : application.status === 'APPROVED'
                  ? '승인됨'
                  : '거절됨'}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 p-4 pb-24">
          {/* 거절 사유 — 최상단 (거절된 경우만) */}
          {application.status === 'REJECTED' && application.rejectionReason && (
            <div>
              <label className={labelClass}>거절 사유</label>
              <div className={`${valueBoxClass} text-red-600 dark:text-red-400`}>
                {application.rejectionReason}
              </div>
            </div>
          )}

          {/* 동아리 이름 */}
          <div>
            <label className={labelClass}>동아리 이름</label>
            <div className={valueBoxClass}>{application.name}</div>
          </div>

          {/* 신청자 — 동아리 이름과 유형·분야 사이 */}
          <div>
            <label className={labelClass}>신청자</label>
            <div className={valueBoxClass}>
              {application.applicantName || '(이름 없음)'} · {application.applicantEmail}
            </div>
          </div>

          {/* 동아리유형 · 분야 */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <label className={labelClass}>동아리유형</label>
              <div className={valueBoxClass}>
                {application.type ? TYPE_LABELS[application.type] : '미기재'}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <label className={labelClass}>분야</label>
              <div className={valueBoxClass}>
                {application.category ? CATEGORY_LABELS[application.category] : '미기재'}
              </div>
            </div>
          </div>

          {/* 신청 사유 */}
          <div>
            <label className={labelClass}>신청 사유</label>
            <div className={`${valueBoxClass} min-h-[200px] whitespace-pre-wrap`}>
              {application.applicationReason ?? application.description ?? '-'}
            </div>
          </div>

          {/* 대기 시: 제일 밑에 거절/수락 버튼 (shadcn 스타일), 거절 시 껍데기 없이 사유+버튼만 */}
          {isPending && (
            <div className="space-y-4 pt-2">
              {showRejectInput ? (
                <>
                  <label className="block text-xs font-normal text-gray-500 dark:text-zinc-400">
                    거절 사유 (선택)
                  </label>
                  <textarea
                    placeholder="거절 사유를 입력하세요. 신청자에게 전달됩니다."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[80px] w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectSubmit}
                      disabled={rejectApplication.isPending}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      {rejectApplication.isPending ? '처리 중...' : '거절하기'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleRejectClick}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    거절
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approveApplication.isPending}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {approveApplication.isPending ? '처리 중...' : '수락'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
