import {
  AdminApplicationItem,
  ClubCreationReq,
  ClubCreationRequestRes,
  ClubDeletionReq,
  ClubDeletionRequestRes,
  ClubDetailRes,
  ClubListParams,
  ClubListRes,
  ClubRankingRes,
  PageResponse,
  UpdateClubInfoReq,
} from '@/types/api';
import { apiClient } from '@/lib/api';

type PageClubListRes = PageResponse<ClubListRes>;

/** 랭킹 API 응답이 배열이거나 content/data/list 등으로 감싼 형태일 수 있음. 항상 ClubRankingRes[] 반환 */
function normalizeRankingList(raw: unknown): ClubRankingRes[] {
  if (Array.isArray(raw)) return raw as ClubRankingRes[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['data', 'content', 'list', 'results']) {
      const val = o[key];
      if (Array.isArray(val)) return val as ClubRankingRes[];
    }
  }
  return [];
}

function buildClubListParams(
  p: ClubListParams
): Record<string, string | number | boolean | undefined> {
  const page = p.page ?? p.pageable?.page ?? 0;
  const size = p.size ?? p.pageable?.size ?? 20;
  const params: Record<string, string | number | boolean | undefined> = {
    page,
    size,
  };
  if (p.category) params.category = p.category;
  if (p.type) params.type = p.type;
  if (p.college) params.college = p.college;
  if (p.recruitmentStatus) params.recruitmentStatus = p.recruitmentStatus;
  if (p.targetGraduate != null) params.targetGraduate = p.targetGraduate;
  if (p.isLeaveOfAbsenceActive != null) params.isLeaveOfAbsenceActive = p.isLeaveOfAbsenceActive;
  if (p.query) params.query = p.query;
  // API 정렬: latest, popularity, viewCount, deadline 지원. default/기본순 → latest 후 클라이언트에서 무작위, name,asc → 클라이언트에서 이름순
  const apiSort = p.sort && p.sort !== 'name,asc' && p.sort !== 'default' ? p.sort : 'latest';
  params.sort = apiSort;
  return params;
}

export const clubApi = {
  getClubList: async (params: ClubListParams): Promise<PageClubListRes> => {
    return apiClient<PageClubListRes>('/api/clubs', {
      params: buildClubListParams(params),
    });
  },

  getClubDetail: async (clubId: number): Promise<ClubDetailRes> => {
    return apiClient<ClubDetailRes>(`/api/clubs/${clubId}`);
  },

  getTopWeeklyView: async (): Promise<ClubRankingRes[]> => {
    const raw = await apiClient<unknown>('/api/clubs/top/weekly-view');
    return normalizeRankingList(raw);
  },

  getTopWeeklyLike: async (): Promise<ClubRankingRes[]> => {
    const raw = await apiClient<unknown>('/api/clubs/top/weekly-like');
    return normalizeRankingList(raw);
  },

  /** 좋아요 토글 - 응답 liked 로 현재 상태 반영 */
  toggleLike: async (clubId: number): Promise<{ liked: boolean }> => {
    return apiClient<{ liked: boolean }>(`/api/clubs/${clubId}/like`, { method: 'POST' });
  },

  getLikedClubs: async (): Promise<ClubListRes[]> => {
    const data = await apiClient<ClubListRes[]>('/api/users/me/liked-clubs');
    return Array.isArray(data) ? data : [];
  },

  /** 알림 신청 */
  subscribe: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/subscribe`, { method: 'POST' });
  },

  /** 알림 취소 */
  unsubscribe: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/subscribe`, { method: 'DELETE' });
  },

  // ---------- 동아리 생성 신청 ----------
  createRequest: async (data: ClubCreationReq): Promise<ClubCreationRequestRes> => {
    return apiClient<ClubCreationRequestRes>('/api/clubs/requests', {
      method: 'POST',
      body: data,
    });
  },

  getMyRequests: async (): Promise<ClubCreationRequestRes[]> => {
    const data = await apiClient<ClubCreationRequestRes[]>('/api/clubs/requests/my');
    return Array.isArray(data) ? data : [];
  },

  /**
   * 관리자: 전체 동아리 생성 신청 목록. GET /api/admin/clubs/creation-requests
   * (일반 사용자 내 목록은 getMyRequests → GET /api/clubs/requests/my)
   */
  getAllRequests: async (params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<ClubCreationRequestRes>> => {
    const query: Record<string, string | number | undefined> = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'createdAt,DESC',
    };
    if (params?.status) query.status = params.status;
    return apiClient<PageResponse<ClubCreationRequestRes>>('/api/admin/clubs/creation-requests', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
  },

  /** 관리자: 동아리 생성 신청 승인. POST /api/admin/clubs/creation-requests/{requestId}/approve */
  approveRequest: async (requestId: number): Promise<ClubCreationRequestRes> => {
    return apiClient<ClubCreationRequestRes>(
      `/api/admin/clubs/creation-requests/${requestId}/approve`,
      { method: 'POST' }
    );
  },

  /** 관리자: 동아리 생성 신청 거절. POST /api/admin/clubs/creation-requests/{requestId}/reject */
  rejectRequest: async (requestId: number, reason: string): Promise<ClubCreationRequestRes> => {
    return apiClient<ClubCreationRequestRes>(
      `/api/admin/clubs/creation-requests/${requestId}/reject`,
      {
        method: 'POST',
        body: { reason },
      }
    );
  },

  // ---------- 하위 호환용 (기존 코드에서 likeClub/unlikeClub 사용 시 toggleLike로 대체 권장) ----------
  likeClub: async (clubId: number): Promise<void> => {
    await clubApi.toggleLike(clubId);
  },

  unlikeClub: async (clubId: number): Promise<void> => {
    await clubApi.toggleLike(clubId);
  },

  getManagedClubs: async (): Promise<ClubListRes[]> => {
    const profile = await apiClient<{ managedClubIds?: number[] }>('/api/users/me');
    const ids = profile?.managedClubIds ?? [];
    if (ids.length === 0) return [];
    const list = await Promise.all(ids.map((id) => clubApi.getClubDetail(id)));
    return list.map((d) => ({
      id: d.id,
      name: d.name,
      logoImage: d.image,
      introduction: d.description ?? '',
      type: d.type,
      category: d.category,
      recruitmentStatus: d.recruitmentStatus,
      isLikedByMe: d.isLikedByMe,
      dday: 0,
      college: d.college,
    }));
  },

  getClubAdmins: async (clubId: number): Promise<string[]> => {
    const members = await apiClient<Array<{ email: string }>>(`/api/clubs/${clubId}/members`);
    return Array.isArray(members) ? members.map((m) => m.email) : [];
  },

  addClubAdmin: async (clubId: number, email: string): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/members`, {
      method: 'POST',
      body: { email },
    });
  },

  removeClubAdmin: async (clubId: number, emailOrUserId: string | number): Promise<void> => {
    const userId =
      typeof emailOrUserId === 'number'
        ? emailOrUserId
        : (await clubApi.getMembers(clubId)).find((m) => m.email === emailOrUserId)?.userId;
    if (userId == null) throw new Error('멤버를 찾을 수 없습니다.');
    return apiClient<void>(`/api/clubs/${clubId}/members/${userId}`, { method: 'DELETE' });
  },

  getMembers: async (
    clubId: number
  ): Promise<Array<{ userId: number; email: string; name?: string; department?: string }>> => {
    const data = await apiClient<
      Array<{ userId: number; email: string; name?: string; department?: string }>
    >(`/api/clubs/${clubId}/members`);
    return Array.isArray(data) ? data : [];
  },

  /** 동아리 생성 신청 (applyClub 별칭) */
  applyClub: async (data: ClubCreationReq): Promise<ClubCreationRequestRes> => {
    return clubApi.createRequest(data);
  },

  getAllClubsForAdmin: async (
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<AdminApplicationItem[]> => {
    const page = await clubApi.getAllRequests({ ...(status && { status }), page: 0, size: 100 });
    const content = 'content' in page ? page.content : [];
    return (content ?? []).map((r) => ({
      id: r.requestId as number,
      clubId: undefined,
      name: r.clubName,
      image: '',
      description: r.description ?? '',
      applicationReason: r.applicationReason ?? '',
      applicantEmail: r.applicantEmail ?? '',
      applicantName: r.applicantName ?? '',
      createdAt: r.createdAt,
      status: r.status,
      rejectionReason: r.rejectionReason,
      category: r.category,
      type: r.clubType,
    }));
  },

  toggleClubVisibility: async (_clubId: number, _isHidden: boolean): Promise<void> => {
    // 스웨거에 해당 API 없음
  },

  /** 관리자 전용 동아리 삭제 (Soft Delete). 권한: ADMIN */
  deleteClub: async (clubId: number): Promise<void> => {
    return apiClient<void>(`/api/admin/clubs/${clubId}`, { method: 'DELETE' });
  },

  // ---------- 동아리 삭제 신청 (Leader) ----------
  /** 동아리 리더가 삭제 신청. POST /api/clubs/deletion-requests */
  createDeletionRequest: async (data: ClubDeletionReq): Promise<ClubDeletionRequestRes> => {
    return apiClient<ClubDeletionRequestRes>('/api/clubs/deletion-requests', {
      method: 'POST',
      body: {
        clubId: Number(data.clubId),
        deletionReason: String(data.deletionReason ?? ''),
      },
    });
  },

  // ---------- 동아리 삭제 신청 (Admin) ----------
  getDeletionRequests: async (params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    page?: number;
    size?: number;
  }): Promise<PageResponse<ClubDeletionRequestRes>> => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;
    const query: Record<string, string | number | undefined> = {
      page,
      size,
      sort: 'createdAt,DESC',
    };
    if (params?.status) query.status = params.status;
    type RawPage =
      | PageResponse<ClubDeletionRequestRes>
      | {
          data?: { content?: ClubDeletionRequestRes[] };
          content?: ClubDeletionRequestRes[];
          totalPages?: number;
          totalElements?: number;
          size?: number;
          number?: number;
          first?: boolean;
          last?: boolean;
        };
    const raw = await apiClient<RawPage>('/api/admin/clubs/deletion-requests', {
      params: query as Record<string, string | number | boolean | undefined>,
    });
    // 백엔드가 content를 한 단계 더 감싼 경우 대비 (data.content 등)
    const content: ClubDeletionRequestRes[] = Array.isArray(
      (raw as { content?: ClubDeletionRequestRes[] }).content
    )
      ? (raw as { content: ClubDeletionRequestRes[] }).content
      : Array.isArray((raw as { data?: { content?: ClubDeletionRequestRes[] } })?.data?.content)
        ? (raw as { data: { content: ClubDeletionRequestRes[] } }).data.content
        : [];
    return {
      content,
      totalPages: raw?.totalPages ?? 0,
      totalElements: raw?.totalElements ?? content.length,
      size: raw?.size ?? size,
      number: raw?.number ?? page,
      first: raw?.first ?? true,
      last: raw?.last ?? true,
    };
  },

  approveDeletionRequest: async (requestId: number): Promise<ClubDeletionRequestRes> => {
    return apiClient<ClubDeletionRequestRes>(
      `/api/admin/clubs/deletion-requests/${requestId}/approve`,
      { method: 'POST' }
    );
  },

  rejectDeletionRequest: async (
    requestId: number,
    reason: string
  ): Promise<ClubDeletionRequestRes> => {
    return apiClient<ClubDeletionRequestRes>(
      `/api/admin/clubs/deletion-requests/${requestId}/reject`,
      {
        method: 'POST',
        body: { reason },
      }
    );
  },

  getApplications: async (
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<AdminApplicationItem[]> => {
    return clubApi.getAllClubsForAdmin(status);
  },

  getApplicationById: async (applicationId: number): Promise<AdminApplicationItem | null> => {
    const list = await clubApi.getApplications(undefined);
    return list.find((a) => a.id === applicationId) ?? null;
  },

  approveApplication: async (applicationId: number): Promise<void> => {
    await clubApi.approveRequest(applicationId);
  },

  rejectApplication: async (applicationId: number, reason?: string): Promise<void> => {
    await clubApi.rejectRequest(applicationId, reason ?? '');
  },

  getMyApplications: async (): Promise<import('@/types/api').MyApplicationItem[]> => {
    const list = await clubApi.getMyRequests();
    return list.map((r) => ({
      id: r.requestId,
      name: r.clubName,
      image: '',
      description: r.description ?? '',
      createdAt: r.createdAt,
      status: r.status,
      rejectionReason: r.rejectionReason,
    }));
  },

  /** (LEADER) 동아리 정보 수정. PUT /api/clubs/{clubId}/info - 이름, 한줄소개, 기본정보 등 */
  updateClubInfo: async (clubId: number, data: UpdateClubInfoReq): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/info`, {
      method: 'PUT',
      body: data,
    });
  },

  updateDescription: async (
    clubId: number,
    data: { description?: string; profileFileUuid?: string }
  ): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/description`, {
      method: 'PUT',
      body: data,
    });
  },

  updateContent: async (
    clubId: number,
    data: { content: string; contentFileUuid?: string | null }
  ): Promise<void> => {
    const body: { content: string; contentFileUuid?: string } = { content: data.content };
    if (data.contentFileUuid != null && data.contentFileUuid !== '') {
      body.contentFileUuid = data.contentFileUuid;
    }
    return apiClient<void>(`/api/clubs/${clubId}/content`, {
      method: 'PUT',
      body,
    });
  },

  updateBasicInfo: async (
    clubId: number,
    data: {
      leaderName?: string;
      targetGraduate?: string;
      clubRoomLocation?: string;
      weeklyActivity?: string;
      isLeaveOfAbsenceActive?: boolean;
      college?: string;
    }
  ): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/basic-info`, {
      method: 'PUT',
      body: data,
    });
  },

  // ---------- (Leader) 모집 ----------
  updateRecruitmentInfo: async (
    clubId: number,
    data: {
      recruitmentStartTime: string;
      recruitmentEndTime: string;
      applicationLink?: string;
    }
  ): Promise<void> => {
    return apiClient<void>(`/api/clubs/${clubId}/recruitment`, {
      method: 'PUT',
      body: data,
    });
  },

  updateClubDetail: async (clubId: number, data: Record<string, unknown>): Promise<void> => {
    const infoFields: UpdateClubInfoReq = {};
    if (data.name !== undefined) infoFields.clubName = data.name as string;
    if (data.description !== undefined || data.summary !== undefined)
      infoFields.description = (data.description ?? data.summary) as string;
    if (data.profileFileUuid !== undefined)
      infoFields.profileFileUuid = data.profileFileUuid as string;
    if (data.leaderName !== undefined) infoFields.leaderName = data.leaderName as string;
    if (data.targetGraduate !== undefined)
      infoFields.targetGraduate = data.targetGraduate as string;
    if (data.location !== undefined) infoFields.clubRoomLocation = data.location as string;
    if (data.weeklyActivity !== undefined) {
      infoFields.weeklyActivity = data.weeklyActivity as string;
    } else if (data.weeklyActiveFrequency !== undefined) {
      infoFields.weeklyActivity = String(data.weeklyActiveFrequency);
    }
    if (data.allowLeaveOfAbsence !== undefined)
      infoFields.isLeaveOfAbsenceActive = data.allowLeaveOfAbsence as boolean;
    if (data.college !== undefined) infoFields.college = data.college as string;
    if (data.type !== undefined) infoFields.clubType = data.type as UpdateClubInfoReq['clubType'];
    if (data.category !== undefined)
      infoFields.category = data.category as UpdateClubInfoReq['category'];
    if (data.externalLink !== undefined) infoFields.externalLink = data.externalLink as string;
    if (Object.keys(infoFields).length > 0) {
      await clubApi.updateClubInfo(clubId, infoFields);
    }
    if (data.content !== undefined) {
      await clubApi.updateContent(clubId, {
        content: data.content as string,
        contentFileUuid: data.contentFileUuid as string | null | undefined,
      });
    }
    const recruitmentStatus = data.recruitmentStatus as
      | 'RECRUITING'
      | 'SCHEDULED'
      | 'CLOSED'
      | undefined;
    const hasRecruitmentDates =
      data.recruitmentStartDate !== undefined || data.recruitmentEndDate !== undefined;
    const start =
      typeof data.recruitmentStartDate === 'string' ? data.recruitmentStartDate : undefined;
    const end = typeof data.recruitmentEndDate === 'string' ? data.recruitmentEndDate : undefined;

    const applicationLink =
      typeof data.recruitmentUrl === 'string' && data.recruitmentUrl
        ? data.recruitmentUrl
        : undefined;

    if (hasRecruitmentDates && start && end) {
      await clubApi.updateRecruitmentInfo(clubId, {
        recruitmentStartTime: start,
        recruitmentEndTime: end,
        applicationLink,
      });
    }

    // 즉시 시작/마감: 삭제된 POST /start, /close 대신 시간 변경(PUT)으로 처리. 서버 검증(현재 시간 이후)을 위해 ISO 8601 UTC 형식으로 전송.
    const nowIso = new Date().toISOString();
    if (recruitmentStatus === 'RECRUITING' && end) {
      await clubApi.updateRecruitmentInfo(clubId, {
        recruitmentStartTime: nowIso,
        recruitmentEndTime: end,
        applicationLink,
      });
    } else if (recruitmentStatus === 'CLOSED' && start) {
      await clubApi.updateRecruitmentInfo(clubId, {
        recruitmentStartTime: start,
        recruitmentEndTime: nowIso,
        applicationLink,
      });
    }

    // 스웨거: 동아리 수정은 PUT만 지원. 수정 후 갱신은 클라이언트에서 query invalidation으로 refetch (GET /api/clubs/{id} 사용).
  },
};
