'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Spinner } from '@heroui/react';
import { Reorder, useDragControls } from 'framer-motion';

import { FormPageSkeleton } from '@/components/common/skeletons';
import { useClubDetail } from '@/features/club/hooks';
import { useCreateFeed, useImageUpload } from '@/features/feed/hooks';

type PageProps = {
  params: Promise<{ id: string }>;
};

type UploadedFile = { uuid: string; fileUrl: string };

/** 드래그는 밑 그립에서만 가능, 사진 영역은 그립 안 켜짐 */
function FeedImageReorderItem({
  file,
  onRemove,
  canReorder,
}: {
  file: UploadedFile;
  onRemove: () => void;
  canReorder: boolean;
}) {
  const controls = useDragControls();
  const [imageError, setImageError] = useState(false);

  return (
    <Reorder.Item
      value={file}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="relative flex shrink-0 flex-col gap-1 rounded-xl"
    >
      <div className="relative aspect-square w-36 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-700">
        {!imageError && (
          <Image
            src={file.fileUrl}
            alt=""
            fill
            className="pointer-events-none object-cover select-none"
            sizes="144px"
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

function NewFeedContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data: club, isLoading: clubLoading, isError: clubError } = useClubDetail(clubId);
  const createFeed = useCreateFeed(clubId);
  const { uploadImages, isLoading: isUploading, error: uploadError } = useImageUpload(clubId);
  const [content, setContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 없는 동아리 또는 잘못된 id → 홈으로
  useEffect(() => {
    if (Number.isNaN(clubId) || clubId < 1) {
      router.replace('/home');
      return;
    }
    if (clubError || (!clubLoading && !club)) {
      router.replace('/home');
    }
  }, [clubId, clubError, clubLoading, club, router]);

  if (Number.isNaN(clubId) || clubId < 1 || clubError || !club) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FormPageSkeleton />
      </div>
    );
  }

  if (clubLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FormPageSkeleton />
      </div>
    );
  }

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

  const handleRemoveImage = (uuid: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.uuid !== uuid));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('피드 내용을 입력해주세요.');
      return;
    }
    const fileUuids = uploadedFiles.map((f) => f.uuid);
    createFeed.mutate(
      {
        content: content.trim(),
        fileUuids,
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
      {/* 헤더: 테마 변수 사용으로 앱뷰 라이트모드에서도 올바른 배경/글자색 유지 */}
      <div
        className="shrink-0 border-b bg-[var(--card)] text-[var(--foreground)]"
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
          <h1 className="text-lg font-semibold text-[var(--foreground)]">피드 추가</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || createFeed.isPending}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {createFeed.isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4">
        {/* 이미지 추가 버튼만 */}
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
          <p className="shrink-0 text-sm text-red-600 dark:text-red-400">
            {uploadError instanceof Error ? uploadError.message : '업로드 오류'}
          </p>
        )}
        {uploadedFiles.length === 0 ? (
          <label htmlFor="feed-images-upload" className="block w-36 shrink-0 cursor-pointer">
            <span className="flex aspect-square w-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
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
          <div className="drag-area-no-select -mx-4 shrink-0 overflow-x-auto overflow-y-hidden px-4 pb-2">
            <div className="flex items-center gap-3" style={{ width: 'max-content' }}>
              <Reorder.Group
                axis="x"
                values={uploadedFiles}
                onReorder={setUploadedFiles}
                className="flex items-center gap-3"
              >
                {uploadedFiles.map((file) => (
                  <FeedImageReorderItem
                    key={file.uuid}
                    file={file}
                    onRemove={() => handleRemoveImage(file.uuid)}
                    canReorder={uploadedFiles.length > 1}
                  />
                ))}
              </Reorder.Group>
              <label htmlFor="feed-images-upload" className="block shrink-0 cursor-pointer">
                <span className="flex aspect-square w-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                  {isUploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-2xl text-gray-400 dark:text-zinc-400">+</span>
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

export default function NewFeedPage({ params }: PageProps) {
  const { id } = use(params);
  const clubId = parseInt(id, 10);

  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <NewFeedContent clubId={clubId} />
    </Suspense>
  );
}
