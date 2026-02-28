'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useTheme } from 'next-themes';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { deviceApi } from '@/features/device/api';
import { getOrCreateDeviceId } from '@/features/device/device-id';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
        <div className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/80">
          <span className="text-base font-medium text-zinc-900 dark:text-zinc-100">다크 모드</span>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="hidden h-5 w-5 dark:block"
              aria-hidden
            >
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="block h-5 w-5 dark:hidden"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
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
