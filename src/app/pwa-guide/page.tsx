'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PwaGuidePage() {
  const router = useRouter();

  useEffect(() => {
    document.title = '앱 설치 가이드 | 국동이';
    return () => {
      document.title = '국동이';
    };
  }, []);

  return (
    <div className="px-4 pt-2 pb-8">
      <h1 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        앱처럼 설치하기 (iOS)
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Safari에서 이 페이지를 열어주세요. 다른 브라우저에서는 홈 화면 추가가 제한될 수 있어요.
      </p>
      <ol className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            1
          </span>
          <span>
            Safari 하단 중앙의 <strong className="text-zinc-900 dark:text-zinc-100">공유</strong>{' '}
            버튼을 눌러주세요.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            2
          </span>
          <span>
            아래로 스크롤한 뒤{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">홈 화면에 추가</strong>를
            탭해주세요.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            3
          </span>
          <span>
            오른쪽 상단 <strong className="text-zinc-900 dark:text-zinc-100">추가</strong>를 누르면
            홈 화면에 국동이 아이콘이 생겨요. 이제 앱처럼 실행할 수 있습니다.
          </span>
        </li>
      </ol>
      <button
        type="button"
        onClick={() => router.back()}
        className="mt-8 w-full rounded-xl bg-blue-500 py-3.5 font-semibold text-white transition-colors hover:bg-blue-600 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
      >
        확인
      </button>
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        설치 후에는 알림을 켜면 동아리 모집·Q&A 답변 등 소식을 받을 수 있어요.
      </p>
    </div>
  );
}
