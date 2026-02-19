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

export type ClubType = 'CENTRAL' | 'DEPARTMENTAL';

export type RecruitmentStatus = 'RECRUITING' | 'SCHEDULED' | 'CLOSED';

export type LoginReq = {
  googleGrantCode: string;
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
};

export type UserProfileRes = {
  externalUserId: string;
  email: string;
  studentId: string;
  phoneNumber: string;
  department: string;
  clubId?: number;
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
  weeklyActiveFrequency: number;
  recruitmentStatus: RecruitmentStatus;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  totalLikeCount: number;
  totalViewCount: number;
  isLikedByMe: boolean;
  description: string;
  content: string;
  /** 상세 설명에 첨부된 이미지 URL 목록 */
  descriptionImages?: string[];
  category: ClubCategory;
  allowLeaveOfAbsence: boolean;
  /** 동아리 지원 외부 링크 */
  recruitmentUrl?: string;
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

export type ClubListParams = {
  category?: ClubCategory;
  type?: ClubType;
  recruitmentStatus?: RecruitmentStatus;
  targetGraduate?: number;
  weeklyActiveFrequency?: number;
  query?: string;
  pageable: Pageable;
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
};

export type ClubFeedListRes = {
  clubFeedList: ClubFeedRes[];
};

export type FeedCreatedReq = {
  content: string;
  postUrls: { postUrl: string }[];
};

export type PresignedUrlReq = {
  fileName: string;
};

export type PresignedUrlListReq = {
  presignedUrlList: PresignedUrlReq[];
};

export type PresignedUrlRes = {
  presignedUrl: string;
  fileUrl: string;
  s3Key: string;
};

export type PresignedUrlListRes = {
  presignedUrlList: PresignedUrlRes[];
};

export type QuestionCreateReq = {
  question: string;
  userName: string;
};

export type AnswerCreateReq = {
  answer: string;
};

export type QuestionAnswerRes = {
  id: number;
  createdAt: string;
  question: string;
  answer?: string;
  userId: number;
  userName: string;
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
};

export type AdminApplicationItem = {
  id: number;
  clubId?: number;
  name: string;
  image: string;
  description: string;
  applicantEmail: string;
  applicantName: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  /** 분야 */
  category?: ClubCategory;
  /** 단과대 (중앙/학과) */
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
