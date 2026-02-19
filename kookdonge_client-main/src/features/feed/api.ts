import {
  ClubFeedListRes,
  FeedCreatedReq,
  PresignedUrlListReq,
  PresignedUrlListRes,
} from '@/types/api';

const DUMMY_FEEDS: Record<number, ClubFeedListRes> = {
  1: {
    clubFeedList: [
      {
        feedId: 101,
        content: '이번 주말에는 정기 공연 리허설이 있어요! 관심 있는 분들은 언제든지 놀러 오세요.',
        postUrls: [
          'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
      },
      {
        feedId: 102,
        content: '지난 공연 단체샷입니다 🙌 모두 수고하셨어요!',
        postUrls: [
          'https://images.pexels.com/photos/713149/pexels-photo-713149.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
      },
      {
        feedId: 103,
        content: '새로운 멤버들과 함께하는 첫 모임이었어요. 앞으로도 화이팅!',
        postUrls: [
          'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
      },
      {
        feedId: 104,
        content: '오늘 연습실에서 열심히 준비하고 있습니다 💪',
        postUrls: [
          'https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
      },
    ],
  },
  3: {
    clubFeedList: [
      {
        feedId: 201,
        content: '알고리즘 스터디 2기를 모집 중입니다. 매주 1회 오프라인 스터디를 진행합니다.',
        postUrls: [
          'https://images.pexels.com/photos/1181243/pexels-photo-1181243.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
      },
      {
        feedId: 202,
        content: '오늘 스터디에서 다룬 문제들 정리했어요. 복습 꼭 해주세요!',
        postUrls: [
          'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
      },
    ],
  },
};

export const feedApi = {
  getClubFeeds: async (clubId: number): Promise<ClubFeedListRes> => {
    return DUMMY_FEEDS[clubId] ?? { clubFeedList: [] };
  },

  createFeed: async (clubId: number, data: FeedCreatedReq): Promise<void> => {
    // 더미 환경: 피드 추가
    const feeds = DUMMY_FEEDS[clubId];
    if (!feeds) {
      DUMMY_FEEDS[clubId] = { clubFeedList: [] };
    }
    const newFeed = {
      feedId: Date.now(),
      content: data.content,
      postUrls: data.postUrls.map((item) => item.postUrl),
    };
    DUMMY_FEEDS[clubId].clubFeedList.push(newFeed);
  },

  getPresignedUrls: async (
    _clubId: number,
    data: PresignedUrlListReq
  ): Promise<PresignedUrlListRes> => {
    // 더미 환경: 실제 presigned URL 대신 더미 URL 반환
    // 실제 환경에서는 서버에서 presigned URL을 받아서 사용
    return {
      presignedUrlList: data.presignedUrlList.map((item, index) => ({
        presignedUrl: `https://dummy-presigned-url.com/${Date.now()}-${index}`,
        fileUrl: `https://images.pexels.com/photos/${1000 + index}/pexels-photo-${1000 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`,
        s3Key: `clubs/${_clubId || 'temp'}/${Date.now()}-${item.fileName}`,
      })),
    };
  },

  deleteFeed: async (clubId: number, feedId: number): Promise<void> => {
    const feeds = DUMMY_FEEDS[clubId];
    if (feeds) {
      feeds.clubFeedList = feeds.clubFeedList.filter((feed) => feed.feedId !== feedId);
    }
  },
};
