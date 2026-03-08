import type {
  CommunityCommentRes,
  CommunityPostDetailRes,
  CommunityPostRes,
} from '@/types/api';

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
  viewCount?: number;
  /** 현재 사용자가 좋아요 눌렀는지 */
  liked?: boolean;
  /** 현재 사용자가 저장했는지 */
  saved?: boolean;
  /** 목록 썸네일 이미지 URL (없으면 placeholder) */
  imageUrl?: string | null;
  /** 본문 첨부 사진 URL 목록 (상세에서 가로 슬라이드·클릭 시 확대) */
  imageUrls?: string[] | null;
  /** 소속 동아리 ID (삭제 권한: 동아리 리더 여부 판단용) */
  clubId?: number | null;
  /** 본인 글 여부 (API mine) */
  mine?: boolean;
  /** 인기글 여부 (API popular) */
  popular?: boolean;
};

/** API 목록 응답 → UI CommunityPost (content 없음, 목록 카드용) */
export function mapPostResToPost(
  res: CommunityPostRes,
  boardType: BoardType = res.postCategory === 'PROMOTION' ? 'promo' : 'free'
): CommunityPost {
  return {
    id: res.postId,
    boardType,
    title: res.title,
    content: '',
    authorName: res.authorName,
    authorId: 0,
    createdAt: res.createdAt,
    likeCount: res.likeCount,
    saveCount: res.saveCount,
    commentCount: res.commentCount,
    viewCount: res.viewCount,
    liked: res.liked,
    saved: res.saved,
    mine: res.mine,
    popular: res.popular,
    imageUrl: res.imageUrls?.[0] ?? null,
    imageUrls: res.imageUrls ?? null,
    clubId: res.clubId ?? null,
  };
}

/** API 상세 응답 → UI CommunityPost (content 포함) */
export function mapPostDetailResToPost(
  res: CommunityPostDetailRes,
  boardType: BoardType = res.postCategory === 'PROMOTION' ? 'promo' : 'free'
): CommunityPost {
  return {
    ...mapPostResToPost(res, boardType),
    content: res.content ?? '',
  };
}

/** 댓글 UI 타입 (상세 페이지용) */
export type CommunityComment = {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  likeCount: number;
  clubId?: number | null;
  replies?: CommunityComment[];
  liked?: boolean;
  mine?: boolean;
};

/** API 댓글 응답 → UI CommunityComment */
export function mapCommentResToComment(res: CommunityCommentRes): CommunityComment {
  return {
    id: res.commentId,
    authorName: res.authorName,
    content: res.content,
    createdAt: res.createdAt,
    likeCount: res.likeCount,
    clubId: res.clubId ?? null,
    replies: res.replies?.map(mapCommentResToComment),
    liked: res.liked,
    mine: res.mine,
  };
}
