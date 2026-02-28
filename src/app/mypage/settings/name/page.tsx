'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, Input, Spinner } from '@heroui/react';

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
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Link
          href="/mypage/settings"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </Link>
      </div>
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">이름 변경</h1>
      </div>
      <form className="space-y-4 px-4" onSubmit={handleSubmit}>
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
        <Button
          type="submit"
          color="primary"
          className="w-full"
          isDisabled={updateProfile.isPending}
          isLoading={updateProfile.isPending}
        >
          저장
        </Button>
      </form>
    </div>
  );
}
