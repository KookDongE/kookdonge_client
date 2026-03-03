'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Spinner } from '@heroui/react';

import type { ClubFeedRes } from '@/types/api';
import { useClubDetail } from '@/features/club/hooks';
import { useFeed, useImageUpload, useUpdateFeed } from '@/features/feed/hooks';

type PageProps = {
  params: Promise<{ id: string; feedId: string }>;
};

type UploadedFile = { uuid: string; fileUrl: string };

/** feed가 로드된 후에만 마운트되며, 초기 content는 feed에서 한 번만 설정 (effect 없음) */
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const existingUrls = feed.postUrls ?? [];

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const result = await uploadImages(files);
      setUploadedFiles((prev) => [...prev, ...result]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.';
      alert(message);
      console.error(error);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('피드 내용을 입력해주세요.');
      return;
    }
    const fileUuids = uploadedFiles.map((f) => f.uuid);
    updateFeed.mutate(
      {
        feedId,
        data: { content: content.trim(), fileUuids: fileUuids.length > 0 ? fileUuids : undefined },
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-gray-700 dark:text-zinc-300"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">피드 수정</h1>
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
          id="feed-edit-images-upload"
          disabled={isUploading}
        />
        {uploadError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {uploadError instanceof Error ? uploadError.message : '업로드 오류'}
          </p>
        )}

        {existingUrls.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">기존 이미지</p>
            <div className="flex flex-wrap gap-3">
              {existingUrls.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative aspect-square w-24 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="96px" unoptimized />
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">추가한 이미지</p>
            <div className="flex flex-wrap items-center gap-3">
              {uploadedFiles.map((f, index) => (
                <div
                  key={f.uuid}
                  className="relative aspect-square w-24 overflow-hidden rounded-xl"
                >
                  <Image src={f.fileUrl} alt="" fill className="object-cover" sizes="96px" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
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
              ))}
            </div>
          </div>
        )}

        <label htmlFor="feed-edit-images-upload">
          <span className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
            {isUploading ? (
              <Spinner size="sm" />
            ) : (
              <span className="text-2xl text-gray-400 dark:text-zinc-400">+ 이미지 추가</span>
            )}
          </span>
        </label>

        <textarea
          placeholder="피드 내용을 입력해주세요"
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
