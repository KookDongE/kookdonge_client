'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

import { Button, Input } from '@heroui/react';

import { TablePageSkeleton } from '@/components/common/skeletons';
import { useGrantAdmin, useRevokeAdmin, useSystemAdmins } from '@/features/admin';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: admins = [], isLoading } = useSystemAdmins();
  const grantAdmin = useGrantAdmin();
  const revokeAdmin = useRevokeAdmin();

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim();
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (!email.includes('@')) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (admins.some((a) => a.email === email)) {
      alert('이미 등록된 관리자입니다.');
      return;
    }
    try {
      await grantAdmin.mutateAsync(email);
      setNewAdminEmail('');
      alert('시스템 관리자가 추가되었습니다.');
    } catch {
      // 에러 메시지는 apiClient에서 toast로 표시됨
    }
  };

  const handleRemoveAdmin = async (userId: number, email: string) => {
    if (!confirm(`정말 ${email} 시스템 관리자 권한을 제거하시겠습니까?`)) return;
    try {
      await revokeAdmin.mutateAsync(userId);
      alert('시스템 관리자가 제거되었습니다.');
    } catch {
      // 에러 메시지는 apiClient에서 toast로 표시됨
    }
  };

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <TablePageSkeleton rows={3} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <TablePageSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-zinc-900">
      <div className="space-y-4 p-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            시스템 관리자 추가
          </label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="admin@kookmin.ac.kr"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddAdmin();
                }
              }}
              disabled={grantAdmin.isPending}
            />
            <Button variant="primary" onPress={handleAddAdmin} isDisabled={grantAdmin.isPending}>
              추가
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            현재 시스템 관리자 목록
          </label>
          {admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <p>시스템 관리자가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.userId}
                  className="flex items-center justify-between rounded-xl bg-white p-4 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {admin.name || admin.email}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {admin.email}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => handleRemoveAdmin(admin.userId, admin.email)}
                    isDisabled={revokeAdmin.isPending}
                  >
                    제거
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
