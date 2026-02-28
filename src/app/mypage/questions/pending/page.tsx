'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

import { Chip, Spinner } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { useMyQuestions } from '@/features/question/hooks';
import { SearchFilterBar } from '@/components/common/search-filter-bar';

/** 답변 목록 전체 (3번: 답변 대기 중인 질문만) - GET /api/clubs/questions/me 후 필터 */
function PendingListContent() {
  const [q] = useQueryState('q', parseAsString.withDefault(''));
  const router = useRouter();
  const { data, isLoading } = useMyQuestions({ page: 0, size: 200 });
  const allList = data?.content ?? [];
  const pending = allList.filter((item) => !item.answer);
  const filtered = q
    ? pending.filter((item) => item.question.toLowerCase().includes(q.trim().toLowerCase()))
    : pending;

  return (
    <div className="pb-6">
      <SearchFilterBar stickyHideOnScroll placeholder="질문 검색" />
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <p>{q ? '검색 결과가 없습니다.' : '답변 대기 중인 질문이 없습니다.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((qna) => (
              <button
                type="button"
                key={qna.id}
                onClick={() =>
                  router.push(
                    qna.clubId
                      ? `/clubs/${qna.clubId}?questionId=${qna.id}`
                      : '/mypage/questions/pending'
                  )
                }
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
              >
                <div className="flex items-start gap-3">
                  <Chip size="sm" color="accent" variant="primary" className="shrink-0">
                    Q
                  </Chip>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {qna.question}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      답변 대기중
                      {qna.clubName ? ` · ${qna.clubName}` : ''}
                      {' · '}
                      {new Date(qna.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingPageContent() {
  return (
    <div className="pb-6">
      <div className="px-4">
        <PendingListContent />
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <PendingPageContent />
    </Suspense>
  );
}
