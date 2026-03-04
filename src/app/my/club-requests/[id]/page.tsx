'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@heroui/react';

import type { ClubCategory, ClubType } from '@/types/api';
import { FormPageSkeleton } from '@/components/common/skeletons';
import { useMyRequests } from '@/features/club/hooks';

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

export default function MyApplicationDetailPage() {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const requestId = parseInt(id, 10);
  const router = useRouter();
  const { data: requests, isLoading } = useMyRequests();
  const application = Number.isNaN(requestId)
    ? undefined
    : requests?.find((r) => r.requestId === requestId);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  if (!id || Number.isNaN(requestId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-zinc-400">잘못된 경로입니다.</p>
        <Button className="mt-4" variant="ghost" onPress={() => router.push('/my/club-requests')}>
          목록으로
        </Button>
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

  if (!application) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-zinc-400">신청을 찾을 수 없습니다.</p>
        <Button className="mt-4" variant="ghost" onPress={() => router.push('/my/club-requests')}>
          목록으로
        </Button>
      </div>
    );
  }

  const labelClass = 'mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300';
  const valueBoxClass =
    'w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100';

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-zinc-900">
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
        <div className="flex items-center gap-2">
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

        <div>
          <label className={labelClass}>동아리 이름</label>
          <div className={valueBoxClass}>{application.clubName}</div>
        </div>

        <div>
          <label className={labelClass}>신청자</label>
          <div className={valueBoxClass}>
            {application.applicantName ?? '(이름 없음)'} · {application.applicantEmail ?? '-'}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <label className={labelClass}>동아리유형</label>
            <div className={valueBoxClass}>
              {application.clubType ? TYPE_LABELS[application.clubType] : '미기재'}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClass}>분야</label>
            <div className={valueBoxClass}>
              {application.category ? CATEGORY_LABELS[application.category] : '미기재'}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>신청 사유</label>
          <div className={`${valueBoxClass} min-h-[200px] whitespace-pre-wrap`}>
            {application.description ?? ''}
          </div>
        </div>

        <div>
          <label className={labelClass}>신청일</label>
          <div className={valueBoxClass}>{new Date(application.createdAt).toLocaleString()}</div>
        </div>

        {application.status === 'REJECTED' && application.rejectionReason && (
          <div>
            <label className={labelClass}>거절 사유</label>
            <div className={`${valueBoxClass} text-red-600 dark:text-red-400`}>
              {application.rejectionReason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
