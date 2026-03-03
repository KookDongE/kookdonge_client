'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, TextArea } from '@heroui/react';

export default function BugReportPage() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    // 아직 준비중: 실제 전송 없이 잠깐 로딩 후 안내만
    setTimeout(() => {
      setIsSubmitting(false);
      alert('아직 준비중인 기능이에요. 곧 열릴 예정이에요!');
    }, 600);
  };

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Link
          href="/mypage/settings"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </Link>
      </div>
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">버그 신고</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">아직 준비중인 기능이에요.</p>
      </div>
      <form className="space-y-4 px-4" onSubmit={handleSubmit}>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          내용
        </label>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="발견한 버그나 불편한 점을 알려주세요."
          className="min-h-[6rem] w-full resize-none border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="버그 신고 내용"
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isDisabled={!content.trim() || isSubmitting}
          isPending={isSubmitting}
        >
          전송
        </Button>
      </form>
    </div>
  );
}
