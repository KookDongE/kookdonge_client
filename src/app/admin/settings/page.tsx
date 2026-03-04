'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import { Button, Input } from '@heroui/react';

import { TablePageSkeleton } from '@/components/common/skeletons';
import { useGrantAdmin, useRevokeAdmin, useSystemAdmins } from '@/features/admin';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addConfirmEmail, setAddConfirmEmail] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{ userId: number; email: string } | null>(null);
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

  const handleAddAdminClick = () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (admins.some((a) => a.email.toLowerCase() === email)) {
      alert('이미 등록된 관리자입니다.');
      return;
    }
    setAddConfirmEmail(email);
  };

  const handleAddConfirm = async () => {
    if (!addConfirmEmail) return;
    try {
      await grantAdmin.mutateAsync(addConfirmEmail);
      setNewAdminEmail('');
      setAddConfirmEmail(null);
      alert('시스템 관리자가 추가되었습니다.');
    } catch {
      // 에러 메시지는 apiClient에서 toast로 표시됨
    }
  };

  const handleRemoveAdminClick = (userId: number, email: string) => {
    if (profile?.email && profile.email.toLowerCase() === email.toLowerCase()) {
      alert('본인 계정의 관리자 권한은 제거할 수 없습니다.');
      return;
    }
    setRemoveConfirm({ userId, email });
  };

  const handleRemoveConfirm = async () => {
    if (!removeConfirm) return;
    try {
      await revokeAdmin.mutateAsync(removeConfirm.userId);
      setRemoveConfirm(null);
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
          <div className="bg-default-100 relative flex min-h-0 w-full rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800/50">
            <Input
              type="email"
              placeholder="admin@kookmin.ac.kr"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddAdminClick();
                }
              }}
              disabled={grantAdmin.isPending}
              className="min-h-[2.5rem] w-full min-w-0 border-0 bg-transparent py-2 pr-14 pl-3 shadow-none placeholder:text-zinc-400 hover:shadow-none focus:ring-0 dark:placeholder:text-zinc-500"
            />
            <Button
              size="sm"
              variant="primary"
              onPress={handleAddAdminClick}
              isDisabled={grantAdmin.isPending}
              isPending={grantAdmin.isPending}
              className="absolute top-1/2 right-1.5 h-7 min-h-7 shrink-0 -translate-y-1/2 px-2 text-xs"
            >
              추가
            </Button>
          </div>
        </div>
        <div>
          <label className="mt-4 mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
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
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800"
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
                    onPress={() => handleRemoveAdminClick(admin.userId, admin.email)}
                    isDisabled={revokeAdmin.isPending}
                    isIconOnly
                    aria-label="제거"
                    className="min-w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {addConfirmEmail != null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-zinc-100">
                시스템 관리자 추가
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-zinc-400">
                &quot;{addConfirmEmail}&quot;을(를) 시스템 관리자로 추가하시겠습니까?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onPress={() => setAddConfirmEmail(null)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={handleAddConfirm}
                  isPending={grantAdmin.isPending}
                >
                  추가
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {removeConfirm != null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-zinc-100">
                관리자 권한 제거
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-zinc-400">
                정말 &quot;{removeConfirm.email}&quot; 시스템 관리자 권한을 제거하시겠습니까?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onPress={() => setRemoveConfirm(null)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  onPress={handleRemoveConfirm}
                  isPending={revokeAdmin.isPending}
                >
                  제거
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
