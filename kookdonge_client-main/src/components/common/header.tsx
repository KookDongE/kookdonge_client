'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HIDDEN_PATHS = ['/login', '/register'];

export function Header() {
  const pathname = usePathname();

  // 피드 페이지 경로 숨기기
  if (HIDDEN_PATHS.includes(pathname) || pathname.includes('/feed')) {
    return null;
  }

  return (
    <header className="glass sticky top-0 z-40 border-b-0">
      <div className="flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex flex-col items-start gap-1">
          <span className="text-xl font-black tracking-tight text-blue-500 dark:text-lime-400">
            KookDongE
          </span>
          <p className="text-xs text-zinc-500">
            해당 프로젝트는 대학혁신지원사업의 일환으로 진행된 프로젝트 입니다.
          </p>
        </Link>
      </div>
    </header>
  );
}
