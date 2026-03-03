'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner, Tabs } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import type { QuestionAnswerRes } from '@/types/api';
import {
  useMyQuestions,
  useQuestionsForMeAsManager,
} from '@/features/question/hooks';

function QnaCard({
  qna,
  onClick,
}: {
  qna: QuestionAnswerRes;
  onClick: () => void;
}) {
  const hasAnswer = qna.answer != null && qna.answer !== '';
  const dateStr = new Date(qna.createdAt).toLocaleDateString('ko-KR');

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80"
    >
      {/* Q 섹션: Q 아이콘 + 질문 내용 + 날짜/상태/동아리 + 화살표 */}
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
          aria-hidden
        >
          Q
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
            {qna.question}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {dateStr}
            {hasAnswer ? ' · 답변완료' : ' · 대기중'}
            {qna.clubName ? ` · ${qna.clubName}` : ''}
          </p>
        </div>
        <svg
          className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {/* A 섹션: 답변이 있을 때만 표시 (앱뷰 라이트모드에서 중간선 검은색 방지) */}
      {hasAnswer && (
        <div className="mt-3 flex items-start gap-3 border-t border-t-[#e4e4e7] pt-3 dark:border-t-zinc-700">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
            aria-hidden
          >
            A
          </span>
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {qna.answer}
          </p>
        </div>
      )}
    </button>
  );
}

function QuestionsTabContent() {
  const router = useRouter();
  const { data, isLoading } = useMyQuestions({ page: 0, size: 200 });
  const list = data?.content ?? [];

  return (
    <div className="px-4 py-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>등록된 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((qna) => (
            <QnaCard
              key={qna.id}
              qna={qna}
              onClick={() =>
                router.push(
                  qna.clubId
                    ? `/clubs/${qna.clubId}?tab=qna&questionId=${qna.id}`
                    : '/mypage/questions'
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 답변 탭: 나에게 온 질문 (내가 관리하는 동아리에 올라온 질문) — GET .../questions/manage */
function AnswersTabContent() {
  const router = useRouter();
  const { data: list, isLoading } = useQuestionsForMeAsManager();
  const items = Array.isArray(list) ? list : [];

  return (
    <div className="px-4 py-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>나에게 온 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((qna) => (
            <QnaCard
              key={`${qna.clubId ?? 0}-${qna.id}`}
              qna={qna}
              onClick={() =>
                router.push(
                  qna.clubId
                    ? `/clubs/${qna.clubId}?tab=qna&questionId=${qna.id}`
                    : '/mypage/questions'
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TAB_IDS = ['questions', 'answers'] as const;
const TAB_LABELS: Record<(typeof TAB_IDS)[number], string> = {
  questions: '질문',
  answers: '답변',
};

function QuestionsPageContent() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('questions'));
  const selectedKey =
    tab && (TAB_IDS as readonly string[]).includes(tab) ? tab : 'questions';

  return (
    <div className="pb-6">
      <Tabs
        selectedKey={selectedKey}
        onSelectionChange={(key) => setTab(key as string)}
        className="w-full"
      >
        <Tabs.ListContainer className="sticky top-0 z-30 bg-[var(--card)] px-4 pt-3">
          <Tabs.List aria-label="Q&A 탭" className="flex w-full">
            <Tabs.Tab
              id="questions"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {TAB_LABELS.questions}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab
              id="answers"
              className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {TAB_LABELS.answers}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="questions" className="pt-0">
          <QuestionsTabContent />
        </Tabs.Panel>
        <Tabs.Panel id="answers" className="pt-0">
          <AnswersTabContent />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <QuestionsPageContent />
    </Suspense>
  );
}
