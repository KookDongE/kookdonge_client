'use client';

import Image from 'next/image';

import { Reorder, useDragControls } from 'framer-motion';

/** 드래그 순서 변경 가능한 사진 한 칸. id + preview만 있으면 됨 (file/fileUuid는 페이지에서 관리) */
export type PhotoReorderItemBase = { id: string; preview: string };

type PhotoReorderItemProps<T extends PhotoReorderItemBase> = {
  item: T;
  onRemove: () => void;
  canReorder: boolean;
};

export function PhotoReorderItem<T extends PhotoReorderItemBase>({
  item,
  onRemove,
  canReorder,
}: PhotoReorderItemProps<T>) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="relative flex shrink-0 flex-col gap-1 rounded-xl"
    >
      <div className="relative aspect-square w-36 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-700">
        <Image
          src={item.preview}
          alt=""
          fill
          className="pointer-events-none object-cover select-none"
          sizes="144px"
          unoptimized
          draggable={false}
        />
        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          aria-label="사진 삭제"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {canReorder && (
        <div
          role="button"
          tabIndex={0}
          onPointerDown={(e) => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            controls.start(e);
          }}
          className="flex cursor-grab touch-none items-center justify-center gap-0.5 rounded-b-xl py-1.5 text-zinc-400 active:cursor-grabbing dark:text-zinc-500"
          aria-label="드래그하여 순서 변경"
        >
          <span className="inline-block h-1 w-1 rounded-full bg-current" />
          <span className="inline-block h-1 w-1 rounded-full bg-current" />
          <span className="inline-block h-1 w-1 rounded-full bg-current" />
        </div>
      )}
    </Reorder.Item>
  );
}
