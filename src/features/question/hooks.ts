'use client';

import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import type { QuestionAnswerRes } from '@/types/api';
import { AnswerCreateReq, Pageable, QuestionCreateReq } from '@/types/api';

import { useMyProfile } from '@/features/auth/hooks';
import { questionApi } from './api';

export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (clubId: number, pageable: Pageable) =>
    [...questionKeys.lists(), clubId, pageable] as const,
};

export function useQuestions(clubId: number, pageable: Pageable) {
  return useQuery({
    queryKey: questionKeys.list(clubId, pageable),
    queryFn: () => questionApi.getQuestions(clubId, pageable),
    enabled: !!clubId,
  });
}

export function useCreateQuestion(clubId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuestionCreateReq) => questionApi.createQuestion(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: AnswerCreateReq }) =>
      questionApi.registerAnswer(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['questions', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'manage'] });
    },
  });
}

export function usePendingQuestions(clubId: number, pageable: Pageable) {
  return useQuery({
    queryKey: ['questions', 'pending', clubId, pageable],
    queryFn: () => questionApi.getPendingQuestions(clubId, pageable),
    enabled: !!clubId,
  });
}

/** 내가 쓴 질문 목록 (전체 동아리). API 연동 전까지 빈 목록 반환. */
export function useMyQuestions(pageable: Pageable = { page: 0, size: 20 }) {
  return useQuery({
    queryKey: ['questions', 'my', pageable],
    queryFn: () => questionApi.getMyQuestions(pageable),
  });
}

export function useDeleteQuestion(clubId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: number) => questionApi.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['questions', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'manage'] });
    },
  });
}

/** 관리자용 질문 목록 (답변 완료/미답변 필터). GET /api/clubs/{clubId}/questions/manage */
export function useQuestionsForManage(
  clubId: number,
  params: { answered?: boolean; page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: ['questions', 'manage', clubId, params],
    queryFn: () => questionApi.getQuestionsForManage(clubId, params),
    enabled: !!clubId,
  });
}

/**
 * 나에게 온 질문 목록 (내가 관리하는 동아리들에 올라온 질문).
 * GET /api/clubs/{clubId}/questions/manage 를 관리하는 각 동아리마다 호출해 합침.
 * 답변 탭용.
 */
export function useQuestionsForMeAsManager(): {
  data: QuestionAnswerRes[];
  isLoading: boolean;
} {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const managedClubIds = profile?.managedClubIds ?? [];

  const results = useQueries({
    queries: managedClubIds.map((clubId) => ({
      queryKey: ['questions', 'manage', clubId, { page: 0, size: 100 }],
      queryFn: () =>
        questionApi.getQuestionsForManage(clubId, { page: 0, size: 100 }),
      enabled: !!clubId,
    })),
  });

  const combined = useMemo(() => {
    const list: QuestionAnswerRes[] = [];
    for (const res of results) {
      if (res.data?.content) list.push(...res.data.content);
    }
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [results]);

  const isLoading = profileLoading || results.some((r) => r.isLoading);

  return { data: combined, isLoading };
}
