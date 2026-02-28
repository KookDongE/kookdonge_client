'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { deviceApi } from '@/features/device/api';
import { getOrCreateDeviceId } from '@/features/device/device-id';

export default function SettingsPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    const refreshToken = useAuthStore.getState().refreshToken;
    const deviceId = typeof window !== 'undefined' ? getOrCreateDeviceId() : '';
    try {
      if (refreshToken) await authApi.logout({ refreshToken });
    } catch {
      // 서버 오류 시에도 로컬 로그아웃 진행
    }
    if (deviceId) {
      try {
        await deviceApi.deleteDevice(deviceId);
      } catch {
        // 삭제 실패해도 로그아웃은 진행
      }
    }
    clearAuth();
    router.replace('/');
  };

  const handleWithdraw = async () => {
    if (
      !confirm('정말 회원탈퇴를 하시겠습니까?\n탈퇴 후 모든 데이터가 삭제되며 복구할 수 없습니다.')
    )
      return;
    try {
      await authApi.withdraw();
      clearAuth();
      router.replace('/');
      alert('회원탈퇴가 완료되었습니다.');
    } catch {
      // apiClient에서 toast.error로 서버 메시지 표시
    }
  };

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Link
          href="/mypage"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </Link>
      </div>
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">설정</h1>
      </div>
      <div className="space-y-3 px-4">
        <Link
          href="/mypage/notification-settings"
          className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
        >
          알림 설정
        </Link>
        <Link
          href="/mypage/settings/name"
          className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
        >
          이름 변경
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
        >
          로그아웃
        </button>
        <button
          type="button"
          onClick={handleWithdraw}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          회원탈퇴
        </button>
      </div>
    </div>
  );
}
