import { create } from 'zustand';

type LoginRequiredModalState = {
  isOpen: boolean;
  /** 로그인 후 돌아갈 경로 (pathname + search) */
  returnUrl: string | null;
  open: (returnUrl: string) => void;
  close: () => void;
};

export const useLoginRequiredModalStore = create<LoginRequiredModalState>((set) => ({
  isOpen: false,
  returnUrl: null,
  open: (returnUrl) => set({ isOpen: true, returnUrl }),
  close: () => set({ isOpen: false, returnUrl: null }),
}));
