'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminClubListItem, ClubListRes } from '@/types/api';

import { ClubCard } from './club-card';

const ACTION_WIDTH = 72;
/** 삭제 버튼 너비만큼만 스와이프 (알림 삭제와 동일) */

type AdminClubCardProps = {
  club: AdminClubListItem;
  index?: number;
  /** 홈 필터 유지용: 뒤로가기 시 이동할 URL */
  returnTo?: string;
  onDelete: (clubId: number) => void;
};

export function AdminClubCard({ club, index = 0, returnTo, onDelete }: AdminClubCardProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const SWIPE_THRESHOLD = -ACTION_WIDTH;
  const [isSwiped, setIsSwiped] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);

  const handleDragStart = () => {
    setDragStartTime(Date.now());
    setHasDragged(false);
  };

  const handleDrag = (_event: unknown, info: { offset: { x: number } }) => {
    const currentX = info.offset.x;
    setIsSwiped(currentX < SWIPE_THRESHOLD);
    setDragX(currentX);
    if (Math.abs(info.offset.x) > 10) {
      setHasDragged(true);
    }
  };

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    const currentX = info.offset.x;
    if (currentX < SWIPE_THRESHOLD) {
      setDragX(-ACTION_WIDTH);
      setIsSwiped(true);
    } else {
      setDragX(0);
      setIsSwiped(false);
    }
    setTimeout(() => {
      setHasDragged(false);
      setDragStartTime(null);
    }, 150);
  };

  // 스와이프 해제 함수 (카드 위치도 0으로 리셋)
  const resetSwipe = () => {
    setDragX(0);
    setIsSwiped(false);
  };

  // 다른 행동 시 스와이프 해제 (바깥 클릭/터치, 스크롤)
  useEffect(() => {
    if (!isSwiped) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const wrapper = wrapperRef.current;
      const isButton = (e.target as HTMLElement).closest?.('[data-swipe-button]');
      if (wrapper && !wrapper.contains(target) && !isButton) {
        resetSwipe();
      }
    };
    const handleScroll = () => resetSwipe();
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isSwiped]);

  const handleCardClick = (e: React.MouseEvent) => {
    // 스와이프된 상태면 클릭 무시
    if (isSwiped) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // 드래그가 발생했으면 클릭 무시
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // 드래그 시작 후 짧은 시간 내 클릭이면 무시 (드래그로 인한 클릭 방지)
    if (dragStartTime && Date.now() - dragStartTime < 200) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // 단순 클릭이면 동아리 상세 페이지로 이동 (returnTo 있으면 필터 유지용 쿼리 포함)
    router.push(
      returnTo != null && returnTo !== ''
        ? `/clubs/${club.id}?from=${encodeURIComponent(returnTo)}`
        : `/clubs/${club.id}`
    );
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(club.id);
    resetSwipe();
  };

  // AdminClubListItem을 ClubListRes로 변환 (과 태그 등 그대로 표시)
  const clubData: ClubListRes = {
    id: club.id,
    name: club.name,
    logoImage: club.logoImage,
    introduction: club.introduction,
    type: club.type,
    category: club.category,
    recruitmentStatus: club.recruitmentStatus ?? 'RECRUITING',
    isLikedByMe: false,
    dday: club.dday ?? 0,
    college: club.college,
  };

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-2xl">
      {/* 스와이프 시 카드 영역만 버튼 너비(ACTION_WIDTH)만큼 좁혀서 우측에 삭제 버튼만 노출 (알림 삭제와 동일 패턴, Framer Motion은 ClubCard 내부 motion 사용) */}
      <div
        onClick={handleCardClick}
        className="relative z-0 cursor-pointer transition-[width] duration-150 ease-out"
        style={{ width: isSwiped ? `calc(100% - ${ACTION_WIDTH}px)` : '100%' }}
      >
        <ClubCard
          club={clubData}
          index={index}
          disableLink={true}
          drag="x"
          dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          animate={{ x: dragX }}
          transition={{ type: 'tween', duration: 0.2 }}
        />
      </div>

      {/* 삭제 버튼: 알림 삭제와 동일 UI (휴지통 아이콘 + 삭제), 스와이프 시에만 노출 */}
      <div
        className={`absolute top-0 right-0 z-10 flex h-full items-center justify-center bg-white transition-opacity duration-150 dark:bg-zinc-900 ${
          isSwiped ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ width: ACTION_WIDTH }}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={!isSwiped}
          data-swipe-button
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-100 px-2.5 py-1.5 text-red-600 transition-colors hover:bg-red-200 disabled:pointer-events-none dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          aria-label="동아리 삭제"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4 shrink-0"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className="text-[10px] font-medium">삭제</span>
        </button>
      </div>
    </div>
  );
}
