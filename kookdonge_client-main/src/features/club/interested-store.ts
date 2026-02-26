import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ClubType } from '@/types/api';

export type InterestedClubItem = {
  id: number;
  name: string;
  logoImage: string;
  type: ClubType;
};

interface InterestedState {
  clubs: InterestedClubItem[];
}

interface InterestedActions {
  add: (club: InterestedClubItem) => void;
  remove: (clubId: number) => void;
  isInterested: (clubId: number) => boolean;
  getList: () => InterestedClubItem[];
}

export const useInterestedStore = create<InterestedState & InterestedActions>()(
  persist(
    (set, get) => ({
      clubs: [],
      add: (club) =>
        set((state) => {
          if (state.clubs.some((c) => c.id === club.id)) return state;
          return { clubs: [...state.clubs, club] };
        }),
      remove: (clubId) =>
        set((state) => ({
          clubs: state.clubs.filter((c) => c.id !== clubId),
        })),
      isInterested: (clubId) => get().clubs.some((c) => c.id === clubId),
      getList: () => get().clubs,
    }),
    { name: 'interested-clubs' }
  )
);
