import { ClubInWaitingListDto } from '@/types/api';

let dummyWaitingList: ClubInWaitingListDto[] = [
  {
    clubId: 2,
    clubName: '봉사나눔터',
    clubProfileImageUrl:
      'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=400',
    clubType: 'CENTRAL',
    createdAt: '2025-02-18T10:00:00.000Z',
  },
];

export const waitingListApi = {
  getMyWaitingList: async () => {
    return dummyWaitingList;
  },

  addToWaitingList: async (clubId: number) => {
    if (!dummyWaitingList.some((item) => item.clubId === clubId)) {
      dummyWaitingList.push({
        clubId,
        clubName: '알림 신청 동아리',
        clubProfileImageUrl:
          'https://images.pexels.com/photos/207691/pexels-photo-207691.jpeg?auto=compress&cs=tinysrgb&w=400',
        clubType: 'CENTRAL',
        createdAt: new Date().toISOString(),
      });
    }
  },

  removeFromWaitingList: async (clubId: number) => {
    dummyWaitingList = dummyWaitingList.filter((item) => item.clubId !== clubId);
  },
};
