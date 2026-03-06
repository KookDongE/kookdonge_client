'use client';

import { useRouter } from 'next/navigation';

import { useEffect } from 'react';

import { PageCenteredSkeleton } from '@/components/common/skeletons';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';

export default function AdminReportsPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
      return;
    }
    if (profile && isSystemAdmin(profile)) {
      router.replace('/admin/reports/system-error');
    }
  }, [profile, profileLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageCenteredSkeleton />
    </div>
  );
}
