'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnswerCreateReq, Pageable, QuestionCreateReq } from '@/types/api';

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

export function useDeleteQuestion(clubId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: number) => questionApi.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['questions', 'pending'] });
    },
  });
}
