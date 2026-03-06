'use client';

import { Suspense, use, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Spinner } from '@heroui/react';
import { Reorder, useDragControls } from 'framer-motion';

import type { ClubFeedRes } from '@/types/api';
import { FormPageSkeleton } from '@/components/common/skeletons';
import { useClubDetail } from '@/features/club/hooks';
import { IMAGE_ACCEPT_ATTR, validateImageFile } from '@/lib/image-upload-validation';
import { useFeed, useImageUpload, useUpdateFeed } from '@/features/feed/hooks';

type PageProps = {
  params: Promise<{ id: string; feedId: string }>;
};

/** 리스트 한 칸: url + uuid(있으면 서버에 삭제/순서 반영) */
type FeedImageItem = { uuid: string | null; url: string };

/** 드래그는 밑 그립에서만 가능, 사진 영역은 그립 안 켜짐 */
function EditFeedImageReorderItem({
  item,
  onRemove,
  canReorder,
}: {
  item: FeedImageItem;
  onRemove: () => void;
  canReorder: boolean;
}) {
  const controls = useDragControls();
  const [imageError, setImageError] = useState(false);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="relative flex shrink-0 flex-col gap-1 rounded-xl"
    >
      <div className="relative aspect-square w-36 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-700">
        {!imageError && (
          <Image
            src={item.url}
            alt=""
            fill
            className="pointer-events-none object-cover select-none"
            sizes="144px"
            unoptimized={!item.uuid}
            draggable={false}
            onError={() => setImageError(true)}
          />
        )}
        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          aria-label="이미지 삭제"
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

function EditFeedForm({
  clubId,
  feedId,
  feed,
}: {
  clubId: number;
  feedId: number;
  feed: ClubFeedRes;
}) {
  const router = useRouter();
  const updateFeed = useUpdateFeed(clubId);
  const { uploadImages, isLoading: isUploading, error: uploadError } = useImageUpload(clubId);
  const [content, setContent] = useState(feed.content ?? '');
  const initialItems = useMemo((): FeedImageItem[] => {
    const urls = feed.postUrls ?? [];
    const uuids = feed.fileUuids ?? [];
    return urls.map((url, i) => ({ uuid: uuids[i] ?? null, url }));
  }, [feed.postUrls, feed.fileUuids]);
  const [items, setItems] = useState<FeedImageItem[]>(() => initialItems);
  const itemsRef = useRef<FeedImageItem[]>(initialItems);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const hasAnyImages = items.length > 0;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      for (const file of files) validateImageFile(file);
    } catch (err) {
      alert(err instanceof Error ? err.message : '파일 형식 또는 용량을 확인해 주세요.');
      e.target.value = '';
      return;
    }
    try {
      const result = await uploadImages(files);
      setItems((prev) => [...prev, ...result.map((f) => ({ uuid: f.uuid, url: f.fileUrl }))]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.';
      alert(message);
      console.error(error);
    }
    e.target.value = '';
  };

  const handleRemoveImage = (item: FeedImageItem) => {
    setItems((prev) => prev.filter((x) => x !== item));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('피드 내용을 입력해주세요.');
      return;
    }
    const currentItems = itemsRef.current;
    const fileUuids = currentItems.map((i) => i.uuid).filter((u): u is string => u != null);
    // API: fileUuids null이면 파일 유지, 배열이면 해당 순서로 반영(빈 배열이면 전부 삭제)
    updateFeed.mutate(
      {
        feedId,
        data: {
          content: content.trim(),
          fileUuids: fileUuids,
        },
      },
      {
        onSuccess: () => {
          router.push(`/mypage/clubs/${clubId}/manage`);
        },
      }
    );
  };

  return (
    <div
      className="flex flex-col overflow-hidden bg-[var(--card)]"
      style={{ height: 'calc(100dvh - 3.5rem - 4rem)' }}
    >
      <div
        className="shrink-0 bg-[var(--card)] text-[var(--foreground)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">피드 수정</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || updateFeed.isPending}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {updateFeed.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4">
        <input
          type="file"
          accept={IMAGE_ACCEPT_ATTR}
          multiple
          onChange={handleImageFileChange}
          className="hidden"
          id="feed-images-upload"
          disabled={isUploading}
        />
        {uploadError && (
          <p className="shrink-0 text-sm text-red-600 dark:text-red-400">
            {uploadError instanceof Error ? uploadError.message : '업로드 오류'}
          </p>
        )}
        {!hasAnyImages ? (
          <label htmlFor="feed-images-upload" className="block w-36 shrink-0 cursor-pointer">
            <span className="flex aspect-square w-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
              {isUploading ? (
                <Spinner size="sm" />
              ) : (
                <img src="/icons/stash_image-open-light.svg" alt="" className="h-12 w-12" />
              )}
            </span>
          </label>
        ) : (
          <div className="drag-area-no-select no-scrollbar -mx-4 shrink-0 overflow-x-auto overflow-y-hidden px-4 pb-2">
            <div className="flex items-center gap-3" style={{ width: 'max-content' }}>
              <Reorder.Group
                axis="x"
                values={items}
                onReorder={setItems}
                className="flex items-center gap-3"
              >
                {items.map((item) => (
                  <EditFeedImageReorderItem
                    key={item.uuid ?? item.url}
                    item={item}
                    onRemove={() => handleRemoveImage(item)}
                    canReorder={items.length > 1}
                  />
                ))}
              </Reorder.Group>
              <label htmlFor="feed-images-upload" className="block shrink-0 cursor-pointer">
                <span className="flex aspect-square w-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                  {isUploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <img src="/icons/stash_image-open-light.svg" alt="" className="h-12 w-12" />
                  )}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* 피드 내용 입력: 이미지 밑 ~ 네비 바로 위까지 세로 꽉 채움 */}
        <textarea
          placeholder="피드 내용을 입력해주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] flex-1 resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>
    </div>
  );
}

function EditFeedContent({ clubId, feedId }: { clubId: number; feedId: number }) {
  const router = useRouter();
  const { data: club, isLoading: clubLoading, isError: clubError } = useClubDetail(clubId);
  const { data: feed, isLoading: feedLoading, isError: feedError } = useFeed(clubId, feedId);

  useEffect(() => {
    if (Number.isNaN(clubId) || clubId < 1 || Number.isNaN(feedId) || feedId < 1) {
      router.replace('/home');
      return;
    }
    if (clubError || feedError || (!clubLoading && !club) || (!feedLoading && !feed)) {
      if (!clubLoading && !club) router.replace('/home');
      if (!feedLoading && feedError) router.back();
    }
  }, [clubId, feedId, clubError, feedError, clubLoading, club, feedLoading, feed, router]);

  if (Number.isNaN(clubId) || clubId < 1 || Number.isNaN(feedId) || feedId < 1) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FormPageSkeleton />
      </div>
    );
  }

  if (clubLoading || clubError || !club || feedLoading || (feedError && !feed)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FormPageSkeleton />
      </div>
    );
  }

  if (!feed) return null;

  return <EditFeedForm clubId={clubId} feedId={feedId} feed={feed} />;
}

export default function EditFeedPage({ params }: PageProps) {
  const { id, feedId: feedIdStr } = use(params);
  const clubId = parseInt(id, 10);
  const feedId = parseInt(feedIdStr, 10);

  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <EditFeedContent clubId={clubId} feedId={feedId} />
    </Suspense>
  );
}
