'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const APPLICATIONS_URL = '/admin/applications?status=ALL';

export default function AdminClubRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    toast.info('이미 처리된 알림입니다.');
    router.replace(APPLICATIONS_URL);
  }, [router]);

  return null;
}
