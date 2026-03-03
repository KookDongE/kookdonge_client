export type ResponseDTO<T> = {
  status: number;
  message: string;
  timestamp: string;
  data: T;
};

export type RequestDTO<T> = {
  timestamp?: string;
  data: T;
};

export type Pageable = {
  page?: number;
  size?: number;
  sort?: string[];
};

export type PageResponse<T> = {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ClubCategory =
  | 'PERFORMING_ARTS'
  | 'LIBERAL_ARTS_SERVICE'
  | 'EXHIBITION_ARTS'
  | 'RELIGION'
  | 'BALL_LEISURE'
  | 'PHYSICAL_MARTIAL_ARTS'
  | 'ACADEMIC';

export type ClubType = 'CENTRAL' | 'DEPARTMENTAL' | 'ACADEMIC_SOCIETY' | 'CLUB';

export type RecruitmentStatus = 'RECRUITING' | 'SCHEDULED' | 'CLOSED';

export type LoginReq = {
  googleGrantCode: string;
  /** Google 토큰 교환 시 사용할 redirect_uri. 프론트에서 code 발급 시 쓴 값과 동일해야 함(필수). */
  redirectUri?: string;
};

export type LoginRes = {
  externalUserId: string;
  email: string;
  studentId: string;
  phoneNumber: string;
  department: string;
  accessToken: string;
  refreshToken: string;
};

export type RegisterUserReq = {
  googleGrantCode: string;
  department: string;
  studentId: string;
  phoneNumber: string;
};

export type RegisterUserRes = {
  externalUserId: string;
  email: string;
  studentId: string;
  phoneNumber: string;
  department: string;
  accessToken: string;
  refreshToken: string;
};

export type ReissueAccessTokenReq = {
  refreshToken: string;
};

export type ReissueAccessTokenRes = {
  accessToken: string;
  refreshToken: string;
};

/** OAuth 인증 응답 (로그인/회원가입 진입) */
export type OAuthRes = {
  newUser: boolean;
  email?: string;
  registrationToken?: string;
  accessToken?: string;
  refreshToken?: string;
};

/** 회원가입 완료 요청 (추가 정보). 스웨거 CompleteRegistrationReq: 필수 입력은 이름만 */
export type CompleteRegistrationReq = {
  registrationToken: string;
  name: string;
};

export type LogoutReq = { refreshToken: string };

export type UserRole = 'USER' | 'ADMIN';

/**
 * GET /api/users/me 응답 (스웨거 UserProfileRes 기준).
 * - managedClubIds: 동아리장/임원인 동아리 ID 목록 → 해당 동아리 (Leader) API 호출 가능
 * - isAdmin: 스웨거 UserProfileRes "관리자 여부". true면 시스템 관리자 → 관리자 탭·페이지 노출
 * - role: 레거시. isAdmin 없을 때 fallback
 */
export type UserProfileRes = {
  externalUserId?: string;
  name?: string;
  email: string;
  studentId?: string;
  phoneNumber?: string;
  department?: string;
  clubId?: number;
  /** 관리 권한이 있는 동아리 ID 목록 (동아리장/임원). 스웨거: managedClubIds */
  managedClubIds?: number[];
  /** 시스템 관리자 여부. 스웨거 UserProfileRes isAdmin. true면 관리자 탭·페이지 노출 */
  isAdmin?: boolean;
  /** 레거시. isAdmin 없을 때 fallback */
  role?: UserRole;
};

export type ClubListRes = {
  id: number;
  name: string;
  logoImage: string;
  introduction: string;
  type: ClubType;
  category: ClubCategory;
  recruitmentStatus: RecruitmentStatus;
  isLikedByMe: boolean;
  dday: number;
  /** 학과동아리일 때 단과대(과) */
  college?: College;
};

export type ClubDetailRes = {
  id: number;
  name: string;
  image: string;
  /** 동아리 한 줄 소개 */
  summary?: string;
  type: ClubType;
  targetGraduate: string;
  leaderName: string;
  location: string;
  /** API는 weeklyActivity(string), 호환용 number */
  weeklyActiveFrequency?: number;
  weeklyActivity?: string;
  recruitmentStatus: RecruitmentStatus;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  totalLikeCount: number;
  totalViewCount: number;
  isLikedByMe: boolean;
  description: string;
  content: string;
  /** 동아리 소개 이미지 URL (API: contentImageUrl) */
  contentImageUrl?: string;
  /** 하위 호환 */
  descriptionImages?: string[];
  category: ClubCategory;
  allowLeaveOfAbsence: boolean;
  /** 지원 링크 (구글폼 등). 스웨거 applicationLink. 링크 있을 때만 하단 CTA 표시 */
  applicationLink?: string;
  /** 하위 호환 */
  recruitmentUrl?: string;
  /** 외부 링크 (JSON 배열 문자열 또는 단일 URL). 예: [{"name":"인스타그램","url":"https://..."}] */
  externalLink?: string;
  /** 학과동아리일 때 단과대(과) */
  college?: College;
};

export type ClubRankingRes = {
  id: number;
  name: string;
  logoImage: string;
  introduction: string;
  type: ClubType;
  category: ClubCategory;
  recruitmentStatus: RecruitmentStatus;
  isLikedByMe: boolean;
  weeklyViewGrowth: number;
  weeklyLikeGrowth: number;
  dday: number;
};

export type College =
  | 'GLOBAL_HUMANITIES'
  | 'SOCIAL_SCIENCE'
  | 'LAW'
  | 'ECONOMICS'
  | 'BUSINESS'
  | 'INDEPENDENT'
  | 'ENGINEERING'
  | 'SOFTWARE'
  | 'AUTOMOTIVE'
  | 'SCIENCE'
  | 'ARCHITECTURE'
  | 'DESIGN'
  | 'ARTS'
  | 'PHYSICAL_EDUCATION';

export type ClubListParams = {
  category?: ClubCategory;
  type?: ClubType;
  college?: College;
  recruitmentStatus?: RecruitmentStatus;
  targetGraduate?: number;
  isLeaveOfAbsenceActive?: boolean;
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  pageable?: Pageable;
};

export type ClubInWaitingListDto = {
  clubId: number;
  clubName: string;
  clubProfileImageUrl: string;
  clubType: ClubType;
  createdAt?: string;
};

export type ClubFeedRes = {
  feedId: number;
  content: string;
  postUrls: string[];
  /** postUrls와 동일 순서의 파일 UUID (있으면 수정 시 삭제/순서 변경 가능) */
  fileUuids?: string[];
  /** 피드 작성 시간 (ISO date-time) */
  createdAt?: string;
};

export type ClubFeedListRes = {
  clubFeedList: ClubFeedRes[];
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
  hasNext?: boolean;
};

export type FeedUpdateReq = {
  content: string;
  fileUuids?: string[] | null;
};

export type FeedCreatedReq = {
  content: string;
  fileUuids: string[];
};

export type PresignedUrlReq = {
  fileName: string;
};

export type PresignedUrlListReq = {
  presignedUrlList: PresignedUrlReq[];
};

export type PresignedUrlRes = {
  uuid?: string;
  presignedUrl: string;
  fileUrl: string;
  s3Key: string;
};

/** 단일 파일 Presigned URL 응답 (스웨거) */
export type PresignedUrlResponse = {
  uuid: string;
  presignedUrl: string;
  fileUrl: string;
  s3Key: string;
};

export type FileUploadCompleteRequest = {
  uuid: string;
  fileName: string;
  fileSize: number;
  extension: string;
};

export type FileInfoResponse = {
  fileId: number;
  uuid: string;
  fileName: string;
  extension: string;
  fileSize: number;
  fileUrl: string;
  domainType?: string;
};

export type PresignedUrlListRes = {
  presignedUrlList: PresignedUrlRes[];
};

export type QuestionCreateReq = {
  question: string;
};

export type AnswerCreateReq = {
  answer: string;
};

export type QuestionAnswerRes = {
  id: number;
  createdAt: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  userId?: number;
  userName?: string;
  /** 내 질문 목록 API (GET /api/clubs/questions/me) 응답 시 포함 */
  clubId?: number;
  clubName?: string;
};

export type ClubApplyReq = {
  name: string;
  image: string;
  description: string;
};

export type ClubApplyRes = {
  clubId: number;
  name: string;
  image: string;
  description: string;
};

export type AdminClubListItem = {
  id: number;
  name: string;
  logoImage: string;
  introduction: string;
  category: ClubCategory;
  type: ClubType;
  isHidden: boolean;
  recruitmentStatus?: RecruitmentStatus;
};

export type AdminApplicationItem = {
  id: number;
  clubId?: number;
  name: string;
  image: string;
  /** 한줄 소개 등 */
  description?: string;
  /** 신청 사유 (관리자 승인심사 페이지에 표시) */
  applicationReason?: string;
  applicantEmail: string;
  applicantName: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  /** 분야 */
  category?: ClubCategory;
  /** 동아리유형 */
  type?: ClubType;
};

export type MyApplicationItem = {
  id: number;
  name: string;
  image: string;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
};

/** 시스템 관리자 단건 (GET /api/admin/admins, POST 응답) */
export type AdminRes = {
  userId: number;
  name: string;
  email: string;
};

/** 시스템 관리자 권한 부여 요청 (POST /api/admin/admins). 스웨거 AddMemberReq */
export type GrantAdminReq = { email: string };

/** 좋아요 토글 응답 */
export type ClubLikeRes = { liked: boolean };

/** 알림 단건 */
export type NotificationRes = {
  id: number;
  type: string;
  title: string;
  message: string;
  redirectUrl?: string;
  clubId?: number;
  /** Q&A 알림 시 해당 질문 ID (스크롤 이동용, API에서 내려주는 경우 사용) */
  questionId?: number;
  isRead: boolean;
  createdAt: string;
};

/** 알림 목록 응답 */
export type NotificationListRes = {
  notifications: NotificationRes[];
  hasNext: boolean;
  page: number;
  size: number;
};

export type UnreadCountRes = { unreadCount: number };

export type DeviceRegisterReq = {
  deviceId: string;
  fcmToken: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
};

export type NotificationSettingReq = { notificationEnabled: boolean };
export type NotificationSettingRes = { notificationEnabled: boolean };

/** 동아리 정보 수정 요청 (PUT /api/clubs/{clubId}/info). 변경할 필드만 전달 */
export type UpdateClubInfoReq = {
  clubName?: string;
  clubType?: ClubType;
  category?: ClubCategory;
  description?: string;
  profileFileUuid?: string;
  leaderName?: string;
  targetGraduate?: string;
  clubRoomLocation?: string;
  weeklyActivity?: string;
  isLeaveOfAbsenceActive?: boolean;
  college?: string;
  /** 외부 링크 (JSON 배열 문자열). 예: [{"name":"인스타그램","url":"https://..."}] */
  externalLink?: string;
};

/** 동아리 생성 신청 요청 */
export type ClubCreationReq = {
  clubName: string;
  clubType: ClubType;
  category: ClubCategory;
  /** 신청 사유 (필수) */
  applicationReason: string;
  college?: string;
  description?: string;
  image?: string;
};

/** 동아리 생성 신청 응답 */
export type ClubCreationRequestRes = {
  requestId: number;
  userId?: number;
  applicantName?: string;
  applicantEmail?: string;
  clubName: string;
  clubType: ClubType;
  category: ClubCategory;
  college?: string;
  /** 신청 사유 (서버 필수 필드) */
  applicationReason?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
};
