import {
  AdminApplicationItem,
  AdminClubListItem,
  ClubApplyReq,
  ClubCategory,
  ClubDetailRes,
  ClubListParams,
  ClubListRes,
  ClubRankingRes,
  ClubType,
  MyApplicationItem,
  Pageable,
  PageResponse,
  RecruitmentStatus,
} from '@/types/api';

// 더미 동아리 리스트 데이터
const DUMMY_CLUBS: ClubListRes[] = [
  {
    id: 1,
    name: 'KUK Play',
    logoImage:
      'https://images.pexels.com/photos/935959/pexels-photo-935959.jpeg?auto=compress&cs=tinysrgb&w=400',
    introduction: '연극과 뮤지컬을 함께 만드는 공연예술 중앙 동아리입니다.',
    type: 'CENTRAL',
    category: 'PERFORMING_ARTS',
    recruitmentStatus: 'RECRUITING',
    isLikedByMe: false,
    dday: 3,
  },
  {
    id: 2,
    name: '봉사나눔터',
    logoImage:
      'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=400',
    introduction: '지역 사회를 위한 다양한 봉사 활동을 진행합니다.',
    type: 'CENTRAL',
    category: 'LIBERAL_ARTS_SERVICE',
    recruitmentStatus: 'SCHEDULED',
    isLikedByMe: true,
    dday: 10,
  },
  {
    id: 3,
    name: '컴공 학술 소모임',
    logoImage:
      'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=400',
    introduction: '알고리즘, 프로젝트 스터디를 함께 하는 컴퓨터공학부 학술 소모임입니다.',
    type: 'DEPARTMENTAL',
    category: 'ACADEMIC',
    recruitmentStatus: 'RECRUITING',
    isLikedByMe: false,
    dday: 0,
  },
  {
    id: 4,
    name: '캠퍼스 사진동아리',
    logoImage:
      'https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg?auto=compress&cs=tinysrgb&w=400',
    introduction: '필름부터 디지털까지, 사진을 사랑하는 사람들이 모였습니다.',
    type: 'CENTRAL',
    category: 'EXHIBITION_ARTS',
    recruitmentStatus: 'CLOSED',
    isLikedByMe: false,
    dday: 0,
  },
];

// 더미 상세 데이터 (메모리 상태로 관리하여 좋아요 기능 동작)
const DUMMY_CLUB_DETAILS_MAP: Map<number, ClubDetailRes> = new Map([
  [
    1,
    {
      id: 1,
      name: 'KUK Play',
      image:
        'https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=600',
      summary: '연극과 뮤지컬을 함께 만드는 국민대 대표 공연 동아리',
      type: 'CENTRAL',
      targetGraduate: '전학년',
      leaderName: '홍길동',
      location: '학생회관 302호',
      weeklyActiveFrequency: 2,
      recruitmentStatus: 'RECRUITING',
      recruitmentStartDate: new Date().toISOString(),
      recruitmentEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalLikeCount: 42,
      totalViewCount: 1234,
      isLikedByMe: false,
      description: '공연을 통해 성장하는 동아리',
      content:
        'KUK Play는 연극과 뮤지컬 등 다양한 공연을 만드는 중앙 동아리입니다.\n\n연기, 연출, 기획, 무대, 조명 등 공연 전반의 역할을 함께 경험해볼 수 있어요.',
      descriptionImages: [
        'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=600',
        'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=600',
      ],
      category: 'PERFORMING_ARTS',
      allowLeaveOfAbsence: true,
      recruitmentUrl: 'https://apply.kukplay.example.com',
    },
  ],
  [
    3,
    {
      id: 3,
      name: '컴공 학술 소모임',
      image:
        'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=600',
      summary: '알고리즘과 개발 스터디를 함께하는 컴퓨터공학부 학술 소모임',
      type: 'DEPARTMENTAL',
      targetGraduate: '컴퓨터공학부 재학생',
      leaderName: '이서준',
      location: '공학관 505호',
      weeklyActiveFrequency: 1,
      recruitmentStatus: 'RECRUITING',
      recruitmentStartDate: new Date().toISOString(),
      recruitmentEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      totalLikeCount: 17,
      totalViewCount: 532,
      isLikedByMe: true,
      description: '개발과 공부를 좋아하는 사람들의 모임',
      content:
        '알고리즘 스터디, 사이드 프로젝트, 세미나 등을 진행하는 컴퓨터공학부 학술 소모임입니다.\n\n실력보다는 꾸준함을 중요하게 생각해요.',
      descriptionImages: [
        'https://images.pexels.com/photos/1181243/pexels-photo-1181243.jpeg?auto=compress&cs=tinysrgb&w=600',
      ],
      category: 'ACADEMIC',
      allowLeaveOfAbsence: false,
      recruitmentUrl: 'https://forms.gle/computer-science-study',
    },
  ],
]);

function filterByCategory(
  clubs: ClubListRes[],
  category?: ClubCategory
): ClubListRes[] {
  if (!category) return clubs;
  return clubs.filter((club) => club.category === category);
}

function filterByType(clubs: ClubListRes[], type?: ClubType): ClubListRes[] {
  if (!type) return clubs;
  return clubs.filter((club) => club.type === type);
}

function filterByStatus(
  clubs: ClubListRes[],
  status?: RecruitmentStatus
): ClubListRes[] {
  if (!status) return clubs;
  return clubs.filter((club) => club.recruitmentStatus === status);
}

function filterByQuery(clubs: ClubListRes[], query?: string): ClubListRes[] {
  if (!query) return clubs;
  const q = query.toLowerCase();
  return clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(q) ||
      club.introduction.toLowerCase().includes(q)
  );
}

const DUMMY_APPLICATIONS: AdminApplicationItem[] = [
  {
    id: 1,
    name: '새로운 댄스 동아리',
    image: 'https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '힙합, K-POP 등 다양한 장르의 댄스를 함께 즐기는 동아리입니다.',
    applicantEmail: 'dancer@kookmin.ac.kr',
    applicantName: '김댄스',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'PERFORMING_ARTS',
    type: 'CENTRAL',
  },
  {
    id: 2,
    name: '독서 토론 모임',
    image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '책을 읽고 함께 토론하며 생각을 나누는 모임입니다.',
    applicantEmail: 'reader@kookmin.ac.kr',
    applicantName: '이독서',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'ACADEMIC',
    type: 'DEPARTMENTAL',
  },
  {
    id: 3,
    name: '승인된 동아리',
    image: 'https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '이미 승인된 동아리입니다.',
    applicantEmail: 'approved@kookmin.ac.kr',
    applicantName: '승인자',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'APPROVED',
    category: 'PERFORMING_ARTS',
    type: 'CENTRAL',
  },
  {
    id: 4,
    name: '거절된 동아리',
    image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '거절된 동아리입니다.',
    applicantEmail: 'rejected@kookmin.ac.kr',
    applicantName: '거절자',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'REJECTED',
    rejectionReason: '신청 내용이 부족합니다.',
    category: 'EXHIBITION_ARTS',
    type: 'CENTRAL',
  },
  {
    id: 5,
    name: '사진 동아리',
    image: 'https://images.pexels.com/photos/1591061/pexels-photo-1591061.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '사진 촬영과 편집을 함께 배우고 공유하는 동아리입니다.',
    applicantEmail: 'photo@kookmin.ac.kr',
    applicantName: '박사진',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'EXHIBITION_ARTS',
    type: 'CENTRAL',
  },
  {
    id: 6,
    name: '음악 동아리',
    image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '밴드 활동과 음악 연주를 즐기는 동아리입니다.',
    applicantEmail: 'music@kookmin.ac.kr',
    applicantName: '최음악',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'PERFORMING_ARTS',
    type: 'CENTRAL',
  },
  {
    id: 7,
    name: '축구 동아리',
    image: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '축구를 사랑하는 사람들이 모여 함께 운동하는 동아리입니다.',
    applicantEmail: 'soccer@kookmin.ac.kr',
    applicantName: '정축구',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'BALL_LEISURE',
    type: 'CENTRAL',
  },
  {
    id: 8,
    name: '코딩 스터디',
    image: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '프로그래밍을 함께 배우고 프로젝트를 진행하는 스터디입니다.',
    applicantEmail: 'coding@kookmin.ac.kr',
    applicantName: '강코딩',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'ACADEMIC',
    type: 'DEPARTMENTAL',
  },
  {
    id: 9,
    name: '요리 동아리',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '다양한 요리를 함께 만들고 맛보는 동아리입니다.',
    applicantEmail: 'cooking@kookmin.ac.kr',
    applicantName: '윤요리',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'LIBERAL_ARTS_SERVICE',
    type: 'CENTRAL',
  },
  {
    id: 10,
    name: '영화 감상 모임',
    image: 'https://images.pexels.com/photos/1486281/pexels-photo-1486281.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '영화를 함께 보고 감상을 나누는 모임입니다.',
    applicantEmail: 'movie@kookmin.ac.kr',
    applicantName: '임영화',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'LIBERAL_ARTS_SERVICE',
    type: 'DEPARTMENTAL',
  },
  {
    id: 11,
    name: '보드게임 동아리',
    image: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '다양한 보드게임을 즐기며 친목을 다지는 동아리입니다.',
    applicantEmail: 'boardgame@kookmin.ac.kr',
    applicantName: '한보드',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'BALL_LEISURE',
    type: 'CENTRAL',
  },
  {
    id: 12,
    name: '등산 동아리',
    image: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '산을 오르며 건강을 챙기고 자연을 즐기는 동아리입니다.',
    applicantEmail: 'hiking@kookmin.ac.kr',
    applicantName: '조등산',
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'PHYSICAL_MARTIAL_ARTS',
    type: 'CENTRAL',
  },
  {
    id: 13,
    name: '그림 동아리',
    image: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '그림을 그리고 작품을 공유하는 동아리입니다.',
    applicantEmail: 'art@kookmin.ac.kr',
    applicantName: '신그림',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'EXHIBITION_ARTS',
    type: 'DEPARTMENTAL',
  },
  {
    id: 14,
    name: '봉사 동아리',
    image: 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '사회 봉사 활동을 통해 나눔을 실천하는 동아리입니다.',
    applicantEmail: 'volunteer@kookmin.ac.kr',
    applicantName: '오봉사',
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    category: 'LIBERAL_ARTS_SERVICE',
    type: 'CENTRAL',
  },
];

export const clubApi = {
  getClubList: async (params: ClubListParams): Promise<PageResponse<ClubListRes>> => {
    const page = params.pageable.page ?? 0;
    const size = params.pageable.size ?? 10;

    let filtered = [...DUMMY_CLUBS];
    filtered = filterByCategory(filtered, params.category);
    filtered = filterByType(filtered, params.type);
    filtered = filterByStatus(filtered, params.recruitmentStatus);
    filtered = filterByQuery(filtered, params.query);

    const start = page * size;
    const end = start + size;
    const pageContent = filtered.slice(start, end);

    return {
      content: pageContent,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      size,
      number: page,
      numberOfElements: pageContent.length,
      first: page === 0,
      last: end >= filtered.length,
      empty: pageContent.length === 0,
    };
  },

  getClubDetail: async (clubId: number): Promise<ClubDetailRes> => {
    const found = DUMMY_CLUB_DETAILS_MAP.get(clubId);
    const base = found ?? DUMMY_CLUB_DETAILS_MAP.get(1)!;
    // 새로운 객체를 반환하여 React Query가 변경을 감지하도록 함
    return { ...base };
  },

  getTopWeeklyView: async (pageable?: Pageable): Promise<PageResponse<ClubRankingRes>> => {
    const size = pageable?.size ?? 5;
    const list: ClubRankingRes[] = DUMMY_CLUBS.slice(0, size).map((club, index) => ({
      ...club,
      introduction: club.introduction,
      weeklyViewGrowth: 100 - index * 10,
      weeklyLikeGrowth: 50 - index * 5,
    }));

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size: list.length,
      number: 0,
      numberOfElements: list.length,
      first: true,
      last: true,
      empty: list.length === 0,
    };
  },

  getTopWeeklyLike: async (pageable?: Pageable): Promise<PageResponse<ClubRankingRes>> => {
    const size = pageable?.size ?? 5;
    const list: ClubRankingRes[] = [...DUMMY_CLUBS]
      .slice()
      .reverse()
      .slice(0, size)
      .map((club, index) => ({
        ...club,
        introduction: club.introduction,
        weeklyViewGrowth: 80 - index * 8,
        weeklyLikeGrowth: 60 - index * 6,
      }));

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size: list.length,
      number: 0,
      numberOfElements: list.length,
      first: true,
      last: true,
      empty: list.length === 0,
    };
  },

  likeClub: async (clubId: number): Promise<void> => {
    const club = DUMMY_CLUB_DETAILS_MAP.get(clubId);
    if (club && !club.isLikedByMe) {
      club.isLikedByMe = true;
      club.totalLikeCount += 1;
    }
  },

  unlikeClub: async (clubId: number): Promise<void> => {
    const club = DUMMY_CLUB_DETAILS_MAP.get(clubId);
    if (club && club.isLikedByMe) {
      club.isLikedByMe = false;
      club.totalLikeCount = Math.max(0, club.totalLikeCount - 1);
    }
  },

  getManagedClubs: async (): Promise<ClubListRes[]> => {
    // 관리 중인 동아리 목록 (더미 데이터: clubId가 1, 3인 동아리)
    return DUMMY_CLUBS.filter((club) => club.id === 1 || club.id === 3);
  },

  updateClubDetail: async (
    clubId: number,
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
    }
  ): Promise<ClubDetailRes> => {
    const club = DUMMY_CLUB_DETAILS_MAP.get(clubId);
    if (!club) {
      throw new Error('Club not found');
    }

    // 업데이트
    if (data.name !== undefined) club.name = data.name;
    if (data.image !== undefined) club.image = data.image;
    if (data.summary !== undefined) club.summary = data.summary;
    if (data.category !== undefined) club.category = data.category;
    if (data.type !== undefined) club.type = data.type;
    if (data.targetGraduate !== undefined) club.targetGraduate = data.targetGraduate;
    if (data.leaderName !== undefined) club.leaderName = data.leaderName;
    if (data.location !== undefined) club.location = data.location;
    if (data.weeklyActiveFrequency !== undefined) club.weeklyActiveFrequency = data.weeklyActiveFrequency;
    if (data.allowLeaveOfAbsence !== undefined) club.allowLeaveOfAbsence = data.allowLeaveOfAbsence;
    if (data.content !== undefined) club.content = data.content;
    if (data.description !== undefined) club.description = data.description;
    if (data.descriptionImages !== undefined) club.descriptionImages = data.descriptionImages;
    if (data.recruitmentStatus !== undefined) club.recruitmentStatus = data.recruitmentStatus;
    if (data.recruitmentStartDate !== undefined) club.recruitmentStartDate = data.recruitmentStartDate;
    if (data.recruitmentEndDate !== undefined) club.recruitmentEndDate = data.recruitmentEndDate;
    if (data.recruitmentUrl !== undefined) club.recruitmentUrl = data.recruitmentUrl;

    return { ...club };
  },

  getLikedClubs: async (): Promise<ClubListRes[]> => {
    // 좋아요를 누른 동아리 목록 (더미 데이터: isLikedByMe가 true인 동아리)
    return DUMMY_CLUBS.filter((club) => club.isLikedByMe);
  },

  getClubAdmins: async (clubId: number): Promise<string[]> => {
    // 더미 데이터: 동아리 관리자 이메일 목록
    const adminMap: Record<number, string[]> = {
      1: ['admin1@kookmin.ac.kr', 'admin2@kookmin.ac.kr'],
      3: ['admin3@kookmin.ac.kr'],
    };
    return adminMap[clubId] || [];
  },

  addClubAdmin: async (clubId: number, email: string): Promise<void> => {
    // 더미 환경에서는 별도 동작 없음
    console.log(`Adding admin ${email} to club ${clubId}`);
  },

  removeClubAdmin: async (clubId: number, email: string): Promise<void> => {
    // 더미 환경에서는 별도 동작 없음
    console.log(`Removing admin ${email} from club ${clubId}`);
  },

  applyClub: async (data: { name: string; image: string; description: string }): Promise<{ clubId: number }> => {
    const newClubId = Math.max(...DUMMY_CLUBS.map((c) => c.id), 0) + 1;
    console.log(`Applying new club: ${data.name}`, data);
    return { clubId: newClubId };
  },

  getAllClubsForAdmin: async (): Promise<AdminClubListItem[]> => {
    return DUMMY_CLUBS.map((club) => ({
      id: club.id,
      name: club.name,
      logoImage: club.logoImage,
      introduction: club.introduction,
      category: club.category,
      type: club.type,
      isHidden: false,
    }));
  },

  toggleClubVisibility: async (clubId: number, isHidden: boolean): Promise<void> => {
    console.log(`Toggling club ${clubId} visibility to ${isHidden}`);
  },

  deleteClub: async (clubId: number): Promise<void> => {
    console.log(`Deleting club ${clubId}`);
  },

  getApplications: async (): Promise<AdminApplicationItem[]> => {
    return [...DUMMY_APPLICATIONS];
  },

  getApplicationById: async (applicationId: number): Promise<AdminApplicationItem | null> => {
    return DUMMY_APPLICATIONS.find((app) => app.id === applicationId) ?? null;
  },

  approveApplication: async (applicationId: number): Promise<void> => {
    console.log(`Approving application ${applicationId}`);
  },

  rejectApplication: async (applicationId: number): Promise<void> => {
    console.log(`Rejecting application ${applicationId}`);
  },

  getMyApplications: async (): Promise<MyApplicationItem[]> => {
    // 사용자의 신청 목록 반환 (더미 데이터)
    return DUMMY_APPLICATIONS.map((app) => ({
      id: app.id,
      name: app.name,
      image: app.image,
      description: app.description,
      createdAt: app.createdAt,
      status: app.status,
      rejectionReason: app.status === 'REJECTED' ? '신청 내용이 부족합니다.' : undefined,
    }));
  },
};
