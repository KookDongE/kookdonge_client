'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { PageCenteredSkeleton } from '@/components/common/skeletons';

export default function AdminCommunityPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageCenteredSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">커뮤니티</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          관리자 전용 커뮤니티 페이지입니다.
        </p>
      </div>
      <div className="px-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            커뮤니티 기능이 준비되면 여기에 내용이 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
