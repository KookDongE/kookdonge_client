'use client';

import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';

import { useClubDetail } from '@/features/club/hooks';

/** 동아리 상세 정보 탭에서만 노출. fixed 우측 하단. 풀리프레시/스크롤과 무관하게 고정 (AppShell 바깥 레이어에서 렌더). */
export function ClubCTAFloatingButton({
  clubId,
  currentTab,
}: {
  clubId: number;
  currentTab: string;
}) {
  const { data: club } = useClubDetail(clubId);
  const applicationLink = club?.applicationLink || club?.recruitmentUrl;
  const shouldShow = !!club && !!applicationLink && currentTab === 'info';

  if (!club || !applicationLink) return null;

  const handleApplyClick = () => {
    window.open(applicationLink, '_blank');
  };

  const bottomOffset = 'calc(8rem + env(safe-area-inset-bottom, 0px))';
  const buttonBottom = 'calc(4rem + 2.5rem + env(safe-area-inset-bottom, 0px))';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
      style={{ top: 'auto', height: bottomOffset }}
      aria-hidden
    >
      <div className="pointer-events-none relative mx-auto h-full w-full max-w-md">
        <div
          className="pointer-events-auto absolute right-4"
          style={{ bottom: buttonBottom }}
        >
          <AnimatePresence mode="wait">
            {shouldShow && (
              <motion.div
                key="club-cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-full bg-white/95 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95"
              >
                <Button
                  size="sm"
                  className="min-w-0 rounded-full px-4 py-2 text-sm font-semibold"
                  variant="primary"
                  onPress={handleApplyClick}
                >
                  지원하기
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
