'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@heroui/react';
import { useTheme } from 'next-themes';
import { createPortal } from 'react-dom';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { deviceApi } from '@/features/device/api';
import { getOrCreateDeviceId } from '@/features/device/device-id';

const SETTINGS_SCROLL_KEY = 'mypage-settings-scroll';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';

function saveSettingsScroll(): void {
  if (typeof window === 'undefined') return;
  const el = document.querySelector('[data-scroll-container]') as HTMLElement | null;
  if (!el) return;
  sessionStorage.setItem(SETTINGS_SCROLL_KEY, String(el.scrollTop));
}

const linkClass =
  'flex min-h-[48px] w-full items-center justify-between gap-3 px-1 py-3 text-left text-base text-zinc-900 transition-colors hover:opacity-80 dark:text-zinc-100';
const buttonClass =
  'flex min-h-[48px] w-full items-center justify-between gap-3 px-1 py-3 text-left text-base text-zinc-900 transition-colors hover:opacity-80 dark:text-zinc-100';
const sectionTitleClass = 'px-1 pt-4 pb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300';
const dividerClass = 'my-4 border-t border-zinc-200 dark:border-zinc-700';

function getThemeLabel(theme: string | undefined): string {
  if (theme === 'dark') return '다크';
  if (theme === 'light') return '라이트';
  return '시스템 기본값';
}

type ConfirmModal = 'logout' | 'withdraw' | null;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);
  const [withdrawPending, setWithdrawPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  // 하위 페이지에서 돌아왔을 때 이전 스크롤 위치 복원 (페이스트·다른 효과 이후에 적용)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem(SETTINGS_SCROLL_KEY);
    if (saved === null) return;
    const scrollTop = parseInt(saved, 10);
    if (!Number.isFinite(scrollTop) || scrollTop < 0) {
      sessionStorage.removeItem(SETTINGS_SCROLL_KEY);
      return;
    }
    const el = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (!el) return;
    sessionStorage.removeItem(SETTINGS_SCROLL_KEY);
    const apply = () => {
      el.scrollTop = scrollTop;
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        apply();
        setTimeout(apply, 50);
      });
    });
  }, []);

  const handleLogout = async () => {
    setConfirmModal(null);
    setLogoutPending(true);
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
    setLogoutPending(false);
    try {
      sessionStorage.setItem('kookdonge-suppress-login-required-modal', '1');
    } catch {
      // ignore
    }
    clearAuth();
    router.replace('/');
  };

  const handleWithdraw = async () => {
    setConfirmModal(null);
    setWithdrawPending(true);
    try {
      await authApi.withdraw();
      try {
        sessionStorage.setItem('kookdonge-suppress-login-required-modal', '1');
      } catch {
        // ignore
      }
      clearAuth();
      if (typeof window !== 'undefined') alert('회원탈퇴가 완료되었습니다.');
      router.replace('/');
    } catch {
      // apiClient에서 toast.error로 서버 메시지 표시
    } finally {
      setWithdrawPending(false);
    }
  };

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <div className="flex min-h-full flex-col pb-6">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">설정</h1>
      </div>
      <div className="px-4">
        {/* 앱 설정 */}
        <section>
          <h2 className={sectionTitleClass}>앱 설정</h2>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={cycleTheme}
              className={buttonClass}
              aria-label="다크 모드 변경"
            >
              <span>다크 모드</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {getThemeLabel(theme)}
              </span>
            </button>
            <Link
              href="/mypage/notification-settings"
              onClick={saveSettingsScroll}
              className={linkClass}
            >
              알림 설정
            </Link>
            <Link href="/mypage/settings/name" onClick={saveSettingsScroll} className={linkClass}>
              내 정보 수정
            </Link>
            <Link
              href="/mypage/settings/bug-report"
              onClick={saveSettingsScroll}
              className={linkClass}
            >
              버그 신고 및 건의사항
            </Link>
          </div>
        </section>

        <div className={dividerClass} />

        {/* 이용 안내 */}
        <section>
          <h2 className={sectionTitleClass}>이용 안내</h2>
          <div className="flex flex-col">
            <div className="flex min-h-[48px] w-full items-center justify-between gap-3 px-1 py-3 text-base text-zinc-900 dark:text-zinc-100">
              <span>앱 버전</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{APP_VERSION}</span>
            </div>
            <Link
              href="/mypage/settings/privacy"
              onClick={saveSettingsScroll}
              className={linkClass}
            >
              개인정보 처리방침
            </Link>
            <Link href="/mypage/settings/terms" onClick={saveSettingsScroll} className={linkClass}>
              서비스 이용약관
            </Link>
            <Link
              href="/mypage/settings/youth-protection"
              onClick={saveSettingsScroll}
              className={linkClass}
            >
              청소년 보호정책
            </Link>
            <Link
              href="/mypage/settings/community-rules"
              onClick={saveSettingsScroll}
              className={linkClass}
            >
              커뮤니티 이용규칙
            </Link>
          </div>
        </section>

        <div className={dividerClass} />

        {/* 계정 */}
        <section>
          <h2 className={sectionTitleClass}>계정</h2>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setConfirmModal('logout')}
              className={buttonClass}
              aria-label="로그아웃"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={() => setConfirmModal('withdraw')}
              className={`${buttonClass} text-zinc-500 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400`}
              aria-label="회원탈퇴"
            >
              회원탈퇴
            </button>
          </div>
        </section>
      </div>

      {/* 로그아웃 확인 모달 */}
      {confirmModal === 'logout' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-zinc-800">
              <h3
                id="logout-modal-title"
                className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                로그아웃
              </h3>
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                로그아웃 하시겠습니까?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 !rounded-lg"
                  onPress={() => setConfirmModal(null)}
                  isDisabled={logoutPending}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 !rounded-lg"
                  onPress={handleLogout}
                  isPending={logoutPending}
                >
                  로그아웃
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 회원탈퇴 확인 모달 */}
      {confirmModal === 'withdraw' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-modal-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-zinc-800">
              <h3
                id="withdraw-modal-title"
                className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                회원탈퇴
              </h3>
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                정말 회원탈퇴를 하시겠습니까? 탈퇴 후 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 !rounded-lg"
                  onPress={() => setConfirmModal(null)}
                  isDisabled={withdrawPending}
                >
                  취소
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 !rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  onPress={handleWithdraw}
                  isPending={withdrawPending}
                >
                  회원탈퇴
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 남는 공간 중앙에 푸터 배치 (살짝 위로) */}
      <div className="mt-6 flex flex-1 flex-col items-center justify-center">
        <footer className="flex -translate-y-4 flex-col items-center justify-center px-4 pt-6 pb-8 text-center">
          <a
            href="https://wink.kookmin.ac.kr/about-us/wink"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center rounded-lg text-center outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <div className="relative mb-4 h-8 w-24">
              <Image
                src="/images/Group 1999.svg"
                alt="WINK"
                fill
                className="object-contain object-center"
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
              서울특별시 성북구 정릉로 77 (국민대학교 미래관 605-1)
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              © WINK 2026. All rights reserved.
            </p>
          </a>
        </footer>
      </div>
    </div>
  );
}
