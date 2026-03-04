/** 게시판 구분: 인기글, 홍보글, 자유게시판 */
export type BoardType = 'popular' | 'promo' | 'free';

export type CommunityPost = {
  id: number;
  boardType: BoardType;
  title: string;
  content: string;
  authorName: string;
  authorId: number;
  createdAt: string;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  /** 현재 사용자가 좋아요 눌렀는지 */
  liked?: boolean;
  /** 현재 사용자가 저장했는지 */
  saved?: boolean;
  /** 목록 썸네일 이미지 URL (없으면 placeholder) */
  imageUrl?: string | null;
};
