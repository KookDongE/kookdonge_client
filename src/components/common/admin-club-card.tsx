'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminClubListItem, ClubListRes } from '@/types/api';

import { ClubCard } from './club-card';

type AdminClubCardProps = {
  club: AdminClubListItem;
  index?: number;
  onToggleVisibility: (clubId: number, isHidden: boolean) => void;
  onDelete: (clubId: number) => void;
};

export function AdminClubCard({
  club,
  index = 0,
  onToggleVisibility,
  onDelete,
}: AdminClubCardProps) {
  const router = useRouter();
  const [dragX, setDragX] = useState(0);
  const SWIPE_THRESHOLD = -80;
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
      setDragX(-120);
      setIsSwiped(true);
    } else {
      setDragX(0);
      setIsSwiped(false);
    }
    // 드래그가 끝난 후 약간의 딜레이를 두고 상태 리셋
    setTimeout(() => {
      setHasDragged(false);
      setDragStartTime(null);
    }, 150);
  };

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
    // 단순 클릭이면 동아리 상세 페이지로 이동
    router.push(`/clubs/${club.id}`);
  };

  const handleHideClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleVisibility(club.id, club.isHidden);
    setDragX(0);
    setIsSwiped(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(club.id);
    setDragX(0);
    setIsSwiped(false);
  };

  // AdminClubListItem을 ClubListRes로 변환
  const clubData: ClubListRes = {
    id: club.id,
    name: club.name,
    logoImage: club.logoImage,
    introduction: club.introduction,
    type: club.type,
    category: club.category,
    recruitmentStatus: 'RECRUITING',
    isLikedByMe: false,
    dday: 0,
  };

  return (
    <div className="relative overflow-hidden">
      {/* ClubCard를 직접 드래그 가능하게 만들기 */}
      <div onClick={handleCardClick} className="cursor-pointer">
        <ClubCard
          club={clubData}
          index={index}
          disableLink={true}
          drag="x"
          dragConstraints={{ left: -120, right: 0 }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
        />
      </div>

      {/* 숨기기/삭제 버튼: 스와이프로 노출된 경우에만 클릭 가능 */}
      <div
        className={`absolute top-0 right-0 flex h-full flex-col justify-center gap-2 px-2 py-2 transition-opacity ${
          isSwiped ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ width: '120px' }}
      >
        <button
          type="button"
          onClick={handleHideClick}
          disabled={!isSwiped}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-gray-200 px-2.5 py-1.5 text-gray-700 transition-colors hover:bg-gray-300 disabled:pointer-events-none dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          </svg>
          <span className="text-[10px] font-medium">숨기기</span>
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={!isSwiped}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-100 px-2.5 py-1.5 text-red-600 transition-colors hover:bg-red-200 disabled:pointer-events-none dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-[10px] font-medium">삭제</span>
        </button>
      </div>
    </div>
  );
}
