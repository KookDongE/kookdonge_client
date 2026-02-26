'use client';

import { use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button, Chip, Spinner } from '@heroui/react';

import type { ClubCategory, ClubType } from '@/types/api';
import { useAdminApplication, useApproveApplication, useRejectApplication } from '@/features/club/hooks';

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
};

type PageProps = { params: Promise<{ id: string }> };

export default function AdminApplicationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const applicationId = parseInt(id, 10);
  const router = useRouter();
  const { data: application, isLoading } = useAdminApplication(applicationId);
  const approveApplication = useApproveApplication();
  const rejectApplication = useRejectApplication();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Spinner />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-zinc-400">신청을 찾을 수 없습니다.</p>
        <Button className="mt-4" variant="light" onPress={() => router.push('/admin')}>
          목록으로
        </Button>
      </div>
    );
  }

  const isPending = application.status === 'PENDING';

  const handleApprove = () => {
    approveApplication.mutate(applicationId, {
      onSuccess: () => {
        alert('신청이 승인되었습니다.');
        router.push('/admin');
      },
    });
  };

  const handleReject = () => {
    rejectApplication.mutate(applicationId, {
      onSuccess: () => {
        alert('신청이 거절되었습니다.');
        router.push('/admin');
      },
    });
  };

  const labelClass = 'mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300';
  const valueBoxClass =
    'w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100';

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-zinc-900">
      {/* 뒤로가기 - 동아리 상세와 동일 */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </button>
      </div>

      <div className="space-y-6 p-4">
        {/* 상태 칩 */}
        <div className="flex items-center gap-2">
          <Chip size="sm" color={isPending ? 'warning' : 'success'} variant="soft">
            {application.status === 'PENDING' ? '승인 대기' : application.status === 'APPROVED' ? '승인됨' : '거절됨'}
          </Chip>
        </div>

        {/* 1. 첨부 사진 (1:1) */}
        <div>
          <label className={labelClass}>첨부 사진</label>
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-600 dark:bg-zinc-800">
            {application.image ? (
              <Image src={application.image} alt={application.name} fill className="object-cover" sizes="100vw" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-400 dark:text-zinc-500">
                🏠
              </div>
            )}
          </div>
        </div>

        {/* 2. 동아리 이름 */}
        <div>
          <label className={labelClass}>동아리 이름</label>
          <div className={valueBoxClass}>{application.name}</div>
        </div>

        {/* 신청자 이메일 */}
        <div>
          <label className={labelClass}>신청자 이메일</label>
          <div className={valueBoxClass}>{application.applicantEmail}</div>
        </div>

        {/* 3. 분야 · 4. 단과대 (가로 배치 - 폼과 동일) */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <label className={labelClass}>분야</label>
            <div className={valueBoxClass}>
              {application.category ? CATEGORY_LABELS[application.category] : '미기재'}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClass}>단과대</label>
            <div className={valueBoxClass}>
              {application.type ? TYPE_LABELS[application.type] : '미기재'}
            </div>
          </div>
        </div>

        {/* 5. 신청 사유 */}
        <div>
          <label className={labelClass}>신청 사유</label>
          <div className={`${valueBoxClass} min-h-[200px] whitespace-pre-wrap`}>{application.description}</div>
        </div>

        {/* 신청일 (참고) */}
        <div>
          <label className={labelClass}>신청일</label>
          <div className={valueBoxClass}>{new Date(application.createdAt).toLocaleString()}</div>
        </div>

        {isPending && (
          <div className="flex gap-3 pt-2">
            <Button
              color="danger"
              variant="flat"
              className="flex-1 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
              onPress={handleReject}
              isPending={rejectApplication.isPending}
            >
              거절
            </Button>
            <Button
              color="primary"
              className="flex-1 bg-blue-500 text-white"
              onPress={handleApprove}
              isPending={approveApplication.isPending}
            >
              수락
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
