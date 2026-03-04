'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { useAdminApplication } from '@/features/club/hooks';
import { FormPageSkeleton } from '@/components/common/skeletons';

const APPLICATIONS_ALL_URL = '/admin/applications?status=ALL';

type PageProps = { params: Promise<{ id: string }> };

export default function AdminClubRequestDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const applicationId = parseInt(id, 10);
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: application, isLoading, isError } = useAdminApplication(applicationId);

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  // 404: 신청 없음 또는 이미 처리됨 → 알림 후 목록으로
  useEffect(() => {
    if (profileLoading || (profile && !isSystemAdmin(profile))) return;
    if (!id || Number.isNaN(applicationId)) return;
    if (isLoading) return;

    if (isError || !application) {
      toast.info('이미 처리된 알림입니다.');
      router.replace(APPLICATIONS_ALL_URL);
    } else {
      router.replace(`/admin/applications/${applicationId}`);
    }
  }, [profile, profileLoading, id, applicationId, isLoading, isError, application, router]);

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <FormPageSkeleton />
    </div>
  );
}
