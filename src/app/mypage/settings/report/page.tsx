'use client';

import { useState, type Key } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ListBox, Select, TextArea } from '@heroui/react';

type ReportReason = 'abuse' | 'spam' | 'illegal' | 'etc';

const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'abuse', label: '욕설·비방' },
  { value: 'spam', label: '스팸' },
  { value: 'illegal', label: '불법·부적절한 내용' },
  { value: 'etc', label: '기타' },
];

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetType = searchParams.get('type') ?? 'post'; // 'post' | 'comment'
  const targetId = searchParams.get('id') ?? '';

  const [content, setContent] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>('abuse');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    // TODO: 실제 신고 API 호출 (targetType, targetId, reportReason, content)
    setTimeout(() => {
      setIsSubmitting(false);
      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      router.back();
    }, 600);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* 헤더: bug-report와 동일 (취소 | 제목 | 전송) */}
      <div className="shrink-0 bg-[var(--card)] text-[var(--foreground)]">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">신고</h1>
          <button
            type="submit"
            form="report-form"
            disabled={!content.trim() || isSubmitting}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {isSubmitting ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>

      <form
        id="report-form"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pb-8"
        onSubmit={handleSubmit}
      >
        <Select
          aria-label="신고 유형 선택"
          placeholder="유형"
          value={reportReason}
          onChange={(value: Key | null) => value && setReportReason(value as ReportReason)}
          className="shrink-0"
        >
          <Select.Trigger className="max-w-[140px] min-w-[140px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
            <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
            <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {REPORT_REASON_OPTIONS.map((opt) => (
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
          placeholder="신고 사유를 구체적으로 적어주세요."
          className="min-h-[24rem] w-full resize-none border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          aria-label="신고 내용"
        />
      </form>
    </div>
  );
}
