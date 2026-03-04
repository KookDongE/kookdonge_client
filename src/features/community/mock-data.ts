import type { BoardType, CommunityPost } from './types';

const now = new Date();
const makeDate = (daysAgo: number) =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

/** 목 데이터: 백엔드 API 연동 전까지 사용 */
function createMockPosts(): CommunityPost[] {
  const boards: BoardType[] = ['popular', 'promo', 'free'];
  const titles: Record<BoardType, string[]> = {
    popular: [
      '2025년 동아리 박람회 후기 (인기)',
      '신입 부원 모집 중입니다! 많은 관심 부탁드려요',
      '정기 공연 일정 공유해요',
      '동아리 방 탈출 이벤트 후기',
      '우리 동아리 소개합니다',
      '함께할 부원 구해요',
      '이번 주 활동 사진 공유',
    ],
    promo: [
      '🎉 홍보: 봄맞이 신입 환영회',
      '동아리 홍보 포스터 공유',
      '모집 공고: 2025 상반기 신입',
      '오픈 채팅방 링크 공유합니다',
      '설명회 일정 안내',
      '홍보 영상 링크 공유',
      '부원 모집 포스터',
    ],
    free: [
      '자유게시판 첫 글입니다',
      '동아리 생활 팁 공유해요',
      '질문 있어요',
      '일정 관련 논의',
      '아이디어 공유',
      '잡담해요',
      '정보 공유합니다',
    ],
  };
  let id = 1;
  const posts: CommunityPost[] = [];
  boards.forEach((boardType) => {
    const list = titles[boardType];
    list.forEach((title, i) => {
      posts.push({
        id: id++,
        boardType,
        title,
        content: `${title}에 대한 내용입니다. 본문 미리보기...`,
        authorName: `작성자${(id % 5) + 1}`,
        authorId: (id % 5) + 1,
        createdAt: makeDate(i * 2 + (id % 3)),
        likeCount: 10 + (id % 50),
        saveCount: 2 + (id % 20),
        commentCount: 0 + (id % 15),
        liked: id % 4 === 0,
        saved: id % 5 === 0,
      });
    });
  });
  return posts;
}

let cachedPosts: CommunityPost[] | null = null;

export function getMockCommunityPosts(): CommunityPost[] {
  if (!cachedPosts) cachedPosts = createMockPosts();
  return [...cachedPosts];
}

export function getPostById(id: number): CommunityPost | null {
  const posts = getMockCommunityPosts();
  return posts.find((p) => p.id === id) ?? null;
}

export type CommunityComment = {
  id: number;
  postId: number;
  authorName: string;
  content: string;
  createdAt: string;
};

function commentDate(ago: number) {
  return new Date(now.getTime() - ago * 60 * 1000).toISOString();
}

/** 글별 댓글 더미 (postId당 0~3개) */
export function getCommentsByPostId(postId: number): CommunityComment[] {
  const names = ['댓글작성자1', '댓글작성자2', '댓글작성자3'];
  const contents = [
    '좋은 정보 감사합니다!',
    '저도 참여하고 싶어요.',
    '언제인가요?',
    '많은 관심 부탁드려요.',
  ];
  const count = postId % 4;
  return Array.from({ length: count }, (_, i) => ({
    id: postId * 10 + i,
    postId,
    authorName: names[i % names.length],
    content: contents[(postId + i) % contents.length],
    createdAt: commentDate((postId + i) * 5 + 10),
  }));
}

export function filterByBoard(posts: CommunityPost[], boardType: BoardType): CommunityPost[] {
  return posts.filter((p) => p.boardType === boardType);
}

export function filterByQuery(posts: CommunityPost[], query: string): CommunityPost[] {
  if (!query.trim()) return posts;
  const q = query.trim().toLowerCase();
  return posts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q)
  );
}

export function sortPosts(posts: CommunityPost[], sort: 'latest' | 'popular'): CommunityPost[] {
  const arr = [...posts];
  if (sort === 'popular') {
    return arr.sort((a, b) => b.likeCount - a.likeCount);
  }
  return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
