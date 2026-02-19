import {
  AnswerCreateReq,
  Pageable,
  PageResponse,
  QuestionAnswerRes,
  QuestionCreateReq,
} from '@/types/api';

const DUMMY_QUESTIONS: QuestionAnswerRes[] = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    question: '신입 모집은 보통 언제 진행되나요?',
    answer: '보통 학기 시작 후 2주 이내에 모집을 진행하고 있습니다.',
    userId: 1,
    userName: 'student1@kookmin.ac.kr',
  },
  {
    id: 2,
    createdAt: new Date().toISOString(),
    question: '동아리 회비가 있나요?',
    answer: '학기당 3만원 정도의 회비가 있으며, 공연 준비에 사용됩니다.',
    userId: 2,
    userName: 'student2@kookmin.ac.kr',
  },
  {
    id: 3,
    createdAt: new Date().toISOString(),
    question: '경험이 없는데 지원해도 괜찮을까요?',
    answer: undefined,
    userId: 3,
    userName: 'newbie@kookmin.ac.kr',
  },
];

export const questionApi = {
  getQuestions: async (
    _clubId: number,
    pageable: Pageable
  ): Promise<PageResponse<QuestionAnswerRes>> => {
    const page = pageable.page ?? 0;
    const size = pageable.size ?? 20;
    const start = page * size;
    const end = start + size;
    const content = DUMMY_QUESTIONS.slice(start, end);

    return {
      content,
      totalElements: DUMMY_QUESTIONS.length,
      totalPages: 1,
      size,
      number: page,
      numberOfElements: content.length,
      first: true,
      last: true,
      empty: content.length === 0,
    };
  },

  getPendingQuestions: async (
    clubId: number,
    pageable: Pageable
  ): Promise<PageResponse<QuestionAnswerRes>> => {
    const page = pageable.page ?? 0;
    const size = pageable.size ?? 20;
    // 답변이 없는 질문만 필터링
    const pendingQuestions = DUMMY_QUESTIONS.filter((q) => !q.answer);
    const start = page * size;
    const end = start + size;
    const content = pendingQuestions.slice(start, end);

    return {
      content,
      totalElements: pendingQuestions.length,
      totalPages: Math.max(1, Math.ceil(pendingQuestions.length / size)),
      size,
      number: page,
      numberOfElements: content.length,
      first: page === 0,
      last: end >= pendingQuestions.length,
      empty: content.length === 0,
    };
  },

  createQuestion: async (_clubId: number, data: QuestionCreateReq): Promise<QuestionAnswerRes> => {
    const newItem: QuestionAnswerRes = {
      id: DUMMY_QUESTIONS.length + 1,
      createdAt: new Date().toISOString(),
      question: data.question,
      answer: undefined,
      userId: 999,
      userName: data.userName,
    };
    DUMMY_QUESTIONS.push(newItem);
    return newItem;
  },

  createAnswer: async (
    questionId: number,
    data: AnswerCreateReq
  ): Promise<QuestionAnswerRes> => {
    const target = DUMMY_QUESTIONS.find((q) => q.id === questionId);
    if (target) {
      target.answer = data.answer;
      return target;
    }
    return {
      id: questionId,
      createdAt: new Date().toISOString(),
      question: '',
      answer: data.answer,
      userId: 0,
      userName: 'admin',
    };
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    const index = DUMMY_QUESTIONS.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      DUMMY_QUESTIONS.splice(index, 1);
    }
  },
};
