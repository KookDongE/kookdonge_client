'use client';

import { useRouter } from 'next/navigation';

import { Input } from '@heroui/react';

import { FormPageSkeleton } from '@/components/common/skeletons';
import { useMyProfile, useUpdateProfile } from '@/features/auth';

export default function NameChangePage() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const currentName = profile?.name ?? profile?.email ?? '';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value?.trim();
    if (!name) return;
    updateProfile.mutate(
      { name },
      {
        onSuccess: () => {
          router.push('/mypage/settings');
        },
        onError: () => {
          // apiClient에서 toast 표시
        },
      }
    );
  };

  if (isProfileLoading) {
    return (
      <div className="pb-6">
        <FormPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* 헤더: 글쓰기 페이지와 동일 (취소 | 제목 | 저장) */}
      <div className="shrink-0 bg-[var(--card)] text-[var(--foreground)]">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">이름 변경</h1>
          <button
            type="submit"
            form="name-change-form"
            disabled={updateProfile.isPending}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {updateProfile.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <form
        id="name-change-form"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pb-8"
        onSubmit={handleSubmit}
      >
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          표시 이름
        </label>
        <Input
          name="name"
          type="text"
          placeholder="이름을 입력하세요"
          defaultValue={currentName}
          maxLength={50}
          required
          className="w-full border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="표시 이름"
        />
      </form>
    </div>
  );
}
