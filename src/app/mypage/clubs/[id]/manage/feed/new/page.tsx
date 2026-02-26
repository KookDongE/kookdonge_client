'use client';

import { Suspense, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Spinner } from '@heroui/react';

import { useCreateFeed, useUploadFeedFiles } from '@/features/feed/hooks';

type PageProps = {
  params: Promise<{ id: string }>;
};

type UploadedFile = { uuid: string; fileUrl: string };

function NewFeedContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const createFeed = useCreateFeed(clubId);
  const uploadFeedFiles = useUploadFeedFiles(clubId);
  const [content, setContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const result = await uploadFeedFiles.mutateAsync(files);
      setUploadedFiles((prev) => [...prev, ...result]);
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
          router.back();
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-zinc-200 dark:bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-gray-700 dark:text-zinc-700"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-900">피드 추가</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || createFeed.isPending}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-600"
          >
            {createFeed.isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>

      <div className="space-y-5 p-4">
        {/* 이미지 추가 버튼만 */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageFileChange}
          className="hidden"
          id="feed-images-upload"
          disabled={uploadFeedFiles.isPending}
        />
        {uploadedFiles.length === 0 ? (
          <label htmlFor="feed-images-upload" className="block w-full cursor-pointer">
            <span className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-400 dark:bg-zinc-100 dark:text-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-200">
              {uploadFeedFiles.isPending ? (
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
            {uploadedFiles.map((f, index) => (
              <div key={f.uuid} className="relative aspect-square w-24 overflow-hidden rounded-xl">
                <Image src={f.fileUrl} alt="" fill className="object-cover" sizes="96px" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
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
            <label htmlFor="feed-images-upload">
              <span className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-300 dark:bg-zinc-100 dark:hover:border-zinc-400 dark:hover:bg-zinc-200">
                {uploadFeedFiles.isPending ? <Spinner size="sm" /> : <span className="text-2xl text-gray-400 dark:text-zinc-500">+</span>}
              </span>
            </label>
          </div>
        )}

        {/* 피드 내용 입력만 */}
        <textarea
          placeholder="피드 내용을 입력해주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full min-h-[150px] resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-200 dark:bg-white dark:text-zinc-900 dark:placeholder-zinc-500"
        />
      </div>
    </div>
  );
}

export default function NewFeedPage({ params }: PageProps) {
  const { id } = use(params);
  const clubId = parseInt(id, 10);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <NewFeedContent clubId={clubId} />
    </Suspense>
  );
}
