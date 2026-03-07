'use client';

import { useState, type Key } from 'react';
import { useRouter } from 'next/navigation';

import { ListBox, Select, TextArea } from '@heroui/react';

import type { FeedbackType } from '@/types/api';
import { feedbackApi } from '@/features/feedback/api';

type ReportType = 'bug' | 'suggestion';

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'bug', label: '버그 신고' },
  { value: 'suggestion', label: '건의사항' },
];

const REPORT_TYPE_TO_API: Record<ReportType, FeedbackType> = {
  bug: 'BUG_REPORT',
  suggestion: 'SUGGESTION',
};

export default function BugReportPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [reportType, setReportType] = useState<ReportType>('bug');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await feedbackApi.create({
        feedbackType: REPORT_TYPE_TO_API[reportType],
        content: content.trim(),
      });
      alert('전송이 완료되었습니다.');
      router.back();
    } catch {
      alert('전송에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* 헤더: 글쓰기 페이지와 동일 (취소 | 제목 | 전송) */}
      <div className="shrink-0 bg-[var(--card)] text-[var(--foreground)]">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">버그 신고 및 건의사항</h1>
          <button
            type="submit"
            form="bug-report-form"
            disabled={!content.trim() || isSubmitting}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {isSubmitting ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>

      <form
        id="bug-report-form"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pb-8"
        onSubmit={handleSubmit}
      >
        <Select
          aria-label="유형 선택"
          placeholder="유형"
          value={reportType}
          onChange={(value: Key | null) => value && setReportType(value as ReportType)}
          className="shrink-0"
        >
          <Select.Trigger className="max-w-[100px] min-w-[100px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {REPORT_TYPE_OPTIONS.map((opt) => (
                <ListBox.Item
                  key={opt.value}
                  id={opt.value}
                  textValue={opt.label}
                  className="!text-zinc-600 dark:!text-zinc-200"
                >
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={reportType === 'bug' ? '발견한 버그나 불편한 점을 알려주세요.' : '건의하실 내용을 알려주세요.'}
          className="min-h-[24rem] w-full resize-none border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="버그 신고 및 건의사항 내용"
        />
      </form>
    </div>
  );
}
