'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ClubCategory,
  ClubCreationReq,
  ClubDetailRes,
  ClubListParams,
  ClubType,
  Pageable,
  RecruitmentStatus,
} from '@/types/api';

import { clubApi } from './api';

export const clubKeys = {
  all: ['clubs'] as const,
  lists: () => [...clubKeys.all, 'list'] as const,
  list: (params: ClubListParams) => [...clubKeys.lists(), params] as const,
  infiniteList: (params: Omit<ClubListParams, 'page'>) =>
    [...clubKeys.lists(), 'infinite', params] as const,
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

/** 무한스크롤용 동아리 목록. 필터/정렬은 동일, page만 증가하며 다음 페이지를 가져옴 */
export function useInfiniteClubList(params: Omit<ClubListParams, 'page'>) {
  const size = params.size ?? 20;
  return useInfiniteQuery({
    queryKey: clubKeys.infiniteList({ ...params, size }),
    queryFn: ({ pageParam }) => clubApi.getClubList({ ...params, page: pageParam as number, size }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last ?? true) return undefined;
      const num = lastPage.number ?? 0;
      return num + 1;
    },
  });
}

export function useClubDetail(clubId: number) {
  return useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => clubApi.getClubDetail(clubId),
    enabled: !!clubId,
  });
}

export function useTopWeeklyView(_pageable?: Pageable) {
  return useQuery({
    queryKey: clubKeys.topWeeklyView(),
    queryFn: () => clubApi.getTopWeeklyView(),
  });
}

export function useTopWeeklyLike(_pageable?: Pageable) {
  return useQuery({
    queryKey: clubKeys.topWeeklyLike(),
    queryFn: () => clubApi.getTopWeeklyLike(),
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
      queryClient.setQueryData(clubKeys.detail(clubId), (old: ClubDetailRes | undefined) => {
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
      queryClient.setQueryData(clubKeys.detail(clubId), (old: ClubDetailRes | undefined) => {
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
        profileFileUuid?: string;
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
    mutationFn: (data: ClubCreationReq) => clubApi.applyClub(data),
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
    mutationFn: ({ applicationId, reason }: { applicationId: number; reason: string }) =>
      clubApi.rejectApplication(applicationId, reason),
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
