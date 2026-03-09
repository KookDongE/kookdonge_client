'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useTheme } from 'next-themes';

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

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
    router.replace('/login');
  };

  const handleWithdraw = async () => {
    if (
      !confirm('정말 회원탈퇴를 하시겠습니까?\n탈퇴 후 모든 데이터가 삭제되며 복구할 수 없습니다.')
    )
      return;
    try {
      await authApi.withdraw();
      clearAuth();
      router.replace('/login');
      alert('회원탈퇴가 완료되었습니다.');
    } catch {
      // apiClient에서 toast.error로 서버 메시지 표시
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
            <button type="button" onClick={handleLogout} className={buttonClass}>
              로그아웃
            </button>
            <button
              type="button"
              onClick={handleWithdraw}
              className={`${buttonClass} text-red-600 dark:text-red-400`}
            >
              회원탈퇴
            </button>
          </div>
        </section>
      </div>

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
