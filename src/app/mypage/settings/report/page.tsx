'use client';

import { useState, type Key } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ListBox, Select, TextArea } from '@heroui/react';

import type { ReportReason as ApiReportReason, ReportType } from '@/types/api';
import { reportApi } from '@/features/report/api';

type ReportReason = 'abuse' | 'spam' | 'illegal' | 'etc';

const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'abuse', label: '욕설·비방' },
  { value: 'spam', label: '스팸' },
  { value: 'illegal', label: '불법·부적절한 내용' },
  { value: 'etc', label: '기타' },
];

const REPORT_REASON_TO_API: Record<ReportReason, ApiReportReason> = {
  abuse: 'ABUSE',
  spam: 'SPAM',
  illegal: 'ILLEGAL',
  etc: 'OTHER',
};

type ReportTargetType = 'qna' | 'post' | 'comment' | 'club';

const REPORT_TARGET_TO_API: Record<ReportTargetType, ReportType> = {
  qna: 'QNA',
  post: 'COMMUNITY_POST',
  comment: 'COMMUNITY_COMMENT',
  club: 'CLUB',
};

/** 수정 불가 드롭다운용 구분 라벨 (Q&A / 게시글 / 댓글 / 동아리) */
const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  qna: 'Q&A',
  post: '게시글',
  comment: '댓글',
  club: '동아리',
};

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetType = (searchParams.get('type') ?? 'post') as ReportTargetType;
  const targetId = searchParams.get('id') ?? '';

  const targetLabel = REPORT_TARGET_LABEL[targetType] ?? '게시글';

  const [content, setContent] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>('abuse');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const contentId = parseInt(targetId, 10);
    if (Number.isNaN(contentId) || contentId < 1) {
      alert('잘못된 대상입니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      await reportApi.create({
        reportType: REPORT_TARGET_TO_API[targetType],
        contentId,
        reportReason: REPORT_REASON_TO_API[reportReason],
        reasonDetail: content.trim(),
      });
      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      router.back();
    } catch {
      alert('신고 접수에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
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
        {/* 수정 불가: 신고 대상 구분 + 신고 유형 — 2열 나열 */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div
            role="combobox"
            aria-label="신고 대상 구분"
            aria-readonly="true"
            className="max-w-[140px] min-w-[140px] rounded-full border border-zinc-300 bg-zinc-100 px-4 py-2 text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {targetLabel}
          </div>
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
        </div>

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
