'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Chip, TextArea } from '@heroui/react';
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
      <div className="min-h-screen bg-[var(--background)] dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4 dark:bg-zinc-900">
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

  const labelClass = 'mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300';
  const valueBoxClass =
    'w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--background)] dark:bg-zinc-900">
      {/* 뒤로가기 - 동아리 상세와 동일 */}
      <div className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 p-4 pb-24">
          {/* 상태 칩 */}
          <div className="flex items-center gap-2">
            <Chip size="sm" color={isPending ? 'warning' : 'success'} variant="soft">
              {application.status === 'PENDING'
                ? '승인 대기'
                : application.status === 'APPROVED'
                  ? '승인됨'
                  : '거절됨'}
            </Chip>
          </div>

          {/* 1. 동아리 이름 */}
          <div>
            <label className={labelClass}>동아리 이름</label>
            <div className={valueBoxClass}>{application.name}</div>
          </div>

          {/* 신청자 이름 · 이메일 */}
          <div>
            <label className={labelClass}>신청자</label>
            <div className={valueBoxClass}>
              {application.applicantName || '(이름 없음)'} · {application.applicantEmail}
            </div>
          </div>

          {/* 동아리유형 · 분야 (가로 배치 - 폼과 동일) */}
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

          {/* 5. 신청 사유 */}
          <div>
            <label className={labelClass}>신청 사유</label>
            <div className={`${valueBoxClass} min-h-[200px] whitespace-pre-wrap`}>
              {application.applicationReason ?? application.description ?? '-'}
            </div>
          </div>

          {/* 신청일 (참고) */}
          <div>
            <label className={labelClass}>신청일</label>
            <div className={valueBoxClass}>{new Date(application.createdAt).toLocaleString()}</div>
          </div>

          {isPending && (
            <div className="space-y-4 pt-2">
              {showRejectInput ? (
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    거절 사유 (선택)
                  </label>
                  <TextArea
                    placeholder="거절 사유를 입력하세요. 신청자에게 전달됩니다."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[80px] w-full resize-y"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onPress={() => {
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      variant="danger-soft"
                      className="flex-1 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                      onPress={handleRejectSubmit}
                      isPending={rejectApplication.isPending}
                    >
                      거절하기
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="danger-soft"
                    className="flex-1 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    onPress={handleRejectClick}
                  >
                    거절
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 bg-blue-500 text-white"
                    onPress={handleApprove}
                    isPending={approveApplication.isPending}
                  >
                    수락
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
