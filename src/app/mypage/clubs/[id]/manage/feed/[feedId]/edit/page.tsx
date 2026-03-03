'use client';

import { Suspense, use, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Spinner } from '@heroui/react';

import type { ClubFeedRes } from '@/types/api';
import { useClubDetail } from '@/features/club/hooks';
import { useFeed, useImageUpload, useUpdateFeed } from '@/features/feed/hooks';

type PageProps = {
  params: Promise<{ id: string; feedId: string }>;
};

/** 리스트 한 칸: url + uuid(있으면 서버에 삭제/순서 반영) */
type FeedImageItem = { uuid: string | null; url: string };

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

  const hasAnyImages = items.length > 0;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const result = await uploadImages(files);
      setItems((prev) => [...prev, ...result.map((f) => ({ uuid: f.uuid, url: f.fileUrl }))]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.';
      alert(message);
      console.error(error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('피드 내용을 입력해주세요.');
      return;
    }
    const fileUuids = items.map((i) => i.uuid).filter((u): u is string => u != null);
    updateFeed.mutate(
      {
        feedId,
        data: {
          content: content.trim(),
          fileUuids: fileUuids.length > 0 ? fileUuids : undefined,
        },
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div
        className="sticky top-0 z-50 border-b bg-[var(--card)] text-[var(--foreground)]"
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

      <div className="space-y-5 p-4">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleImageFileChange}
          className="hidden"
          id="feed-images-upload"
          disabled={isUploading}
        />
        {uploadError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {uploadError instanceof Error ? uploadError.message : '업로드 오류'}
          </p>
        )}
        {!hasAnyImages ? (
          <label htmlFor="feed-images-upload" className="block w-full cursor-pointer">
            <span className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
              {isUploading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-12 w-12"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-base font-medium">이미지 추가</span>
                </>
              )}
            </span>
          </label>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {items.map((item, index) => (
              <div key={item.uuid ?? `img-${index}`} className="relative flex flex-col gap-1">
                <div className="relative aspect-square w-24 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={!item.uuid}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
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
                {items.length > 1 && (
                  <div className="flex justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                      aria-label="위로"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M7 14l5-5 5 5H7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === items.length - 1}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                      aria-label="아래로"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M7 10l5 5 5-5H7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
            <label htmlFor="feed-images-upload">
              <span className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                {isUploading ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="text-2xl text-gray-400 dark:text-zinc-400">+</span>
                )}
              </span>
            </label>
          </div>
        )}

        <textarea
          placeholder="피드 내용을 입력해주세요 (줄바꿈 가능)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="min-h-[150px] w-full resize-y rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
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
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (clubLoading || clubError || !club || feedLoading || (feedError && !feed)) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
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
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <EditFeedContent clubId={clubId} feedId={feedId} />
    </Suspense>
  );
}
