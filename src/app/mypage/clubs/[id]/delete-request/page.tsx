'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TextArea } from '@heroui/react';

import { FormPageSkeleton } from '@/components/common/skeletons';
import { useClubDetail } from '@/features/club/hooks';

type PageProps = { params: Promise<{ id: string }> };

export default function ClubDeleteRequestPage({ params }: PageProps) {
  const { id } = use(params);
  const clubId = parseInt(id, 10);
  const router = useRouter();
  const { data: club, isLoading } = useClubDetail(clubId);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    // TODO: 삭제 신청 API 연동 (예: POST /api/clubs/:id/delete-request)
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/mypage/clubs/${clubId}/manage`);
    }, 500);
  };

  if (isLoading || !club) {
    return (
      <div className="pb-6">
        <FormPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      <div className="shrink-0 bg-[var(--card)] text-[var(--foreground)]">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">삭제 신청</h1>
          <button
            type="submit"
            form="delete-request-form"
            disabled={!reason.trim() || isSubmitting}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {isSubmitting ? '제출 중...' : '제출'}
          </button>
        </div>
      </div>

      <form
        id="delete-request-form"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pb-8"
        onSubmit={handleSubmit}
      >
        <p className="mb-0.5 text-sm font-medium text-gray-700 dark:text-zinc-300">
          동아리
        </p>
        <p className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base font-medium text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
          {club.name}
        </p>

        <label
          htmlFor="delete-reason"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300"
        >
          삭제신청이유
        </label>
        <TextArea
          id="delete-reason"
          name="reason"
          placeholder="삭제 신청 사유를 입력해주세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          required
          className="min-h-[12rem] w-full resize-y border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="삭제신청이유"
        />
      </form>
    </div>
  );
}
