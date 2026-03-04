'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { interestApi } from './api';

export const interestKeys = {
  all: ['interest'] as const,
  mine: () => [...interestKeys.all, 'mine'] as const,
};

export function useMyInterests() {
  return useQuery({
    queryKey: interestKeys.mine(),
    queryFn: interestApi.getMyInterests,
  });
}

export function useAddInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => interestApi.addInterest(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestKeys.all });
    },
  });
}

export function useRemoveInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => interestApi.removeInterest(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestKeys.all });
    },
  });
}
