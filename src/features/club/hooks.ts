'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ClubCategory, ClubListParams, ClubType, Pageable, RecruitmentStatus } from '@/types/api';

import { clubApi } from './api';

export const clubKeys = {
  all: ['clubs'] as const,
  lists: () => [...clubKeys.all, 'list'] as const,
  list: (params: ClubListParams) => [...clubKeys.lists(), params] as const,
  details: () => [...clubKeys.all, 'detail'] as const,
  detail: (id: number) => [...clubKeys.details(), id] as const,
  topWeeklyView: () => [...clubKeys.all, 'top-weekly-view'] as const,
  topWeeklyLike: () => [...clubKeys.all, 'top-weekly-like'] as const,
};

export function useClubList(params: ClubListParams) {
  return useQuery({
    queryKey: clubKeys.list(params),
    queryFn: () => clubApi.getClubList(params),
  });
}

export function useClubDetail(clubId: number) {
  return useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => clubApi.getClubDetail(clubId),
    enabled: !!clubId,
  });
}

export function useTopWeeklyView(pageable?: Pageable) {
  return useQuery({
    queryKey: clubKeys.topWeeklyView(),
    queryFn: () => clubApi.getTopWeeklyView(pageable),
  });
}

export function useTopWeeklyLike(pageable?: Pageable) {
  return useQuery({
    queryKey: clubKeys.topWeeklyLike(),
    queryFn: () => clubApi.getTopWeeklyLike(pageable),
  });
}

export function useLikeClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => clubApi.likeClub(clubId),
    onMutate: async (clubId) => {
      // Optimistic update: 즉시 UI 업데이트
      await queryClient.cancelQueries({ queryKey: clubKeys.detail(clubId) });
      const previousData = queryClient.getQueryData(clubKeys.detail(clubId));
      queryClient.setQueryData(clubKeys.detail(clubId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isLikedByMe: true,
          totalLikeCount: old.totalLikeCount + 1,
        };
      });
      return { previousData };
    },
    onError: (_err, clubId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(clubKeys.detail(clubId), context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useUnlikeClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => clubApi.unlikeClub(clubId),
    onMutate: async (clubId) => {
      // Optimistic update: 즉시 UI 업데이트
      await queryClient.cancelQueries({ queryKey: clubKeys.detail(clubId) });
      const previousData = queryClient.getQueryData(clubKeys.detail(clubId));
      queryClient.setQueryData(clubKeys.detail(clubId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isLikedByMe: false,
          totalLikeCount: Math.max(0, old.totalLikeCount - 1),
        };
      });
      return { previousData };
    },
    onError: (_err, clubId, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(clubKeys.detail(clubId), context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useManagedClubs() {
  return useQuery({
    queryKey: [...clubKeys.all, 'managed'],
    queryFn: () => clubApi.getManagedClubs(),
  });
}

export function useUpdateClubDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clubId,
      data,
    }: {
      clubId: number;
      data: {
        name?: string;
        image?: string;
        summary?: string;
        category?: ClubCategory;
        type?: ClubType;
        targetGraduate?: string;
        leaderName?: string;
        location?: string;
        weeklyActiveFrequency?: number;
        allowLeaveOfAbsence?: boolean;
        content?: string;
        description?: string;
        descriptionImages?: string[];
        recruitmentStatus?: RecruitmentStatus;
        recruitmentStartDate?: string;
        recruitmentEndDate?: string;
        recruitmentUrl?: string;
      };
    }) => clubApi.updateClubDetail(clubId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clubKeys.detail(variables.clubId) });
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useLikedClubs() {
  return useQuery({
    queryKey: [...clubKeys.all, 'liked'],
    queryFn: () => clubApi.getLikedClubs(),
  });
}

export function useClubAdmins(clubId: number) {
  return useQuery({
    queryKey: [...clubKeys.all, 'admins', clubId],
    queryFn: () => clubApi.getClubAdmins(clubId),
    enabled: !!clubId,
  });
}

export function useAddClubAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, email }: { clubId: number; email: string }) =>
      clubApi.addClubAdmin(clubId, email),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...clubKeys.all, 'admins', variables.clubId] });
    },
  });
}

export function useRemoveClubAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, email }: { clubId: number; email: string }) =>
      clubApi.removeClubAdmin(clubId, email),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...clubKeys.all, 'admins', variables.clubId] });
    },
  });
}

export function useApplyClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; image: string; description: string }) => clubApi.applyClub(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

// 관리자 훅
export function useAdminClubs() {
  return useQuery({
    queryKey: [...clubKeys.all, 'admin', 'list'],
    queryFn: () => clubApi.getAllClubsForAdmin(),
  });
}

export function useToggleClubVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, isHidden }: { clubId: number; isHidden: boolean }) =>
      clubApi.toggleClubVisibility(clubId, isHidden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...clubKeys.all, 'admin', 'list'] });
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: number) => clubApi.deleteClub(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...clubKeys.all, 'admin', 'list'] });
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useAdminApplications() {
  return useQuery({
    queryKey: [...clubKeys.all, 'admin', 'applications'],
    queryFn: () => clubApi.getApplications(),
    staleTime: 0,
  });
}

export function useAdminApplication(applicationId: number) {
  return useQuery({
    queryKey: [...clubKeys.all, 'admin', 'application', applicationId],
    queryFn: () => clubApi.getApplicationById(applicationId),
    enabled: !!applicationId,
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: number) => clubApi.approveApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...clubKeys.all, 'admin', 'applications'] });
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: number) => clubApi.rejectApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...clubKeys.all, 'admin', 'applications'] });
    },
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: [...clubKeys.all, 'my-applications'],
    queryFn: () => clubApi.getMyApplications(),
  });
}
