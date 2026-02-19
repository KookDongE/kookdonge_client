import { z } from 'zod';

export const ClubCategorySchema = z.enum([
  'PERFORMING_ARTS',
  'LIBERAL_ARTS_SERVICE',
  'EXHIBITION_ARTS',
  'RELIGION',
  'BALL_LEISURE',
  'PHYSICAL_MARTIAL_ARTS',
  'ACADEMIC',
]);

export const ClubTypeSchema = z.enum(['CENTRAL', 'DEPARTMENTAL']);

export const RecruitmentStatusSchema = z.enum(['RECRUITING', 'SCHEDULED', 'CLOSED']);

export const LoginReqSchema = z.object({
  googleGrantCode: z.string(),
});

export const RegisterUserReqSchema = z.object({
  googleGrantCode: z.string(),
  department: z.string().min(2, '학과는 2자 이상 입력해주세요'),
  studentId: z.string().regex(/^\d{8}$/, '학번은 8자리 숫자로 입력해주세요'),
  phoneNumber: z
    .string()
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 전화번호 형식으로 입력해주세요'),
});

// 회원가입 폼용 (googleGrantCode 제외)
export const RegisterFormSchema = RegisterUserReqSchema.omit({ googleGrantCode: true });

export const ReissueAccessTokenReqSchema = z.object({
  refreshToken: z.string(),
});

export const AnswerCreateReqSchema = z.object({
  answer: z.string(),
});

export const QuestionCreateReqSchema = z.object({
  question: z.string(),
  userName: z.string(),
});

export const PostUrlReqSchema = z.object({
  postUrl: z.string(),
});

export const FeedCreatedReqSchema = z.object({
  content: z.string(),
  postUrls: z.array(PostUrlReqSchema),
});

export const PresignedUrlReqSchema = z.object({
  fileName: z.string(),
});

export const PresignedUrlListReqSchema = z.object({
  presignedUrlList: z.array(PresignedUrlReqSchema),
});

export const PageableSchema = z.object({
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
  sort: z.array(z.string()).optional(),
});

export const ClubListParamsSchema = z.object({
  category: ClubCategorySchema.optional(),
  type: ClubTypeSchema.optional(),
  recruitmentStatus: RecruitmentStatusSchema.optional(),
  targetGraduate: z.number().int().optional(),
  weeklyActiveFrequency: z.number().int().optional(),
  query: z.string().optional(),
  pageable: PageableSchema,
});

export type LoginReqInput = z.input<typeof LoginReqSchema>;
export type RegisterUserReqInput = z.input<typeof RegisterUserReqSchema>;
export type ReissueAccessTokenReqInput = z.input<typeof ReissueAccessTokenReqSchema>;
export type AnswerCreateReqInput = z.input<typeof AnswerCreateReqSchema>;
export type QuestionCreateReqInput = z.input<typeof QuestionCreateReqSchema>;
export type FeedCreatedReqInput = z.input<typeof FeedCreatedReqSchema>;
export type PresignedUrlListReqInput = z.input<typeof PresignedUrlListReqSchema>;
export type ClubListParamsInput = z.input<typeof ClubListParamsSchema>;
