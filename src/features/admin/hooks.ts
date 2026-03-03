import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi } from './api';

const adminKeys = {
  all: ['admin'] as const,
  list: () => [...adminKeys.all, 'admins'] as const,
};

export function useSystemAdmins() {
  return useQuery({
    queryKey: adminKeys.list(),
    queryFn: () => adminApi.getAdmins(),
  });
}

export function useGrantAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => adminApi.grantAdmin({ email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
    },
  });
}

export function useRevokeAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => adminApi.revokeAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
    },
  });
}
