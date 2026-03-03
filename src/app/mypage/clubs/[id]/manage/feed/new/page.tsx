'use client';

import { Suspense, use, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Spinner } from '@heroui/react';
import { motion } from 'framer-motion';

import { useClubDetail } from '@/features/club/hooks';
import { useCreateFeed, useImageUpload } from '@/features/feed/hooks';

type PageProps = {
  params: Promise<{ id: string }>;
};

type UploadedFile = { uuid: string; fileUrl: string };

function NewFeedContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data: club, isLoading: clubLoading, isError: clubError } = useClubDetail(clubId);
  const createFeed = useCreateFeed(clubId);
  const { uploadImages, isLoading: isUploading, error: uploadError } = useImageUpload(clubId);
  const [content, setContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ y: number; x: number; index: number } | null>(null);
  const touchDragActiveRef = useRef(false);

  /** 드래그 중일 때 다른 카드들이 놓을 위치에 맞춰 보여줄 순서 */
  const displayOrderIndices = useMemo(() => {
    if (dragIndex === null || uploadedFiles.length <= 1) return null;
    const without = uploadedFiles.map((_, i) => i).filter((i) => i !== dragIndex);
    const safeOver = Math.max(0, Math.min(dragOverIndex ?? dragIndex, without.length));
    return [...without.slice(0, safeOver), dragIndex, ...without.slice(safeOver)];
  }, [uploadedFiles, dragIndex, dragOverIndex]);

  const reorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex === toIndex) return;
    setUploadedFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    if ((e.target as HTMLElement).closest?.('[data-no-drag]')) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    e.dataTransfer.setDragImage(el, rect.width / 2, rect.height / 2);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = dragIndex ?? parseInt(e.dataTransfer.getData('text/plain') ?? '-1', 10);
    setDragIndex(null);
    setDragOverIndex(null);
    reorder(fromIndex, toIndex);
  };

  const handleTouchStart = (index: number) => (e: React.TouchEvent) => {
    if (uploadedFiles.length <= 1) return;
    if ((e.target as HTMLElement).closest?.('[data-no-drag]')) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, index };
    touchDragActiveRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || uploadedFiles.length <= 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    if (!touchDragActiveRef.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touchDragActiveRef.current = true;
        setDragIndex(touchStartRef.current.index);
        setDragOverIndex(touchStartRef.current.index);
      } else return;
    }
    e.preventDefault();
    const under = document.elementFromPoint(t.clientX, t.clientY);
    const card = under?.closest?.('[data-drag-index]');
    if (card) {
      const idx = (card as HTMLElement).getAttribute('data-drag-index');
      if (idx != null) setDragOverIndex(parseInt(idx, 10));
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchDragActiveRef.current) {
      touchStartRef.current = null;
      return;
    }
    const fromIndex = touchStartRef.current.index;
    const toIndex = dragOverIndex ?? fromIndex;
    reorder(fromIndex, toIndex);
    setDragIndex(null);
    setDragOverIndex(null);
    touchDragActiveRef.current = false;
    touchStartRef.current = null;
  };

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
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (clubLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
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
          router.push(`/mypage/clubs/${clubId}/manage`);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--card)]">
      {/* 헤더: 테마 변수 사용으로 앱뷰 라이트모드에서도 올바른 배경/글자색 유지 */}
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

      <div className="space-y-5 p-4">
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
          <p className="text-sm text-red-600 dark:text-red-400">
            {uploadError instanceof Error ? uploadError.message : '업로드 오류'}
          </p>
        )}
        {uploadedFiles.length === 0 ? (
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
          <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-2">
            <div className="flex items-center gap-3" style={{ width: 'max-content' }}>
              {(displayOrderIndices ?? uploadedFiles.map((_, i) => i)).map((fileIndex, pos) => {
                const f = uploadedFiles[fileIndex];
                const isDragging = dragIndex === fileIndex;
                const isDragOver = dragOverIndex === pos;
                return (
                  <div
                    key={f.uuid}
                    data-drag-index={pos}
                    draggable={uploadedFiles.length > 1}
                    onDragStart={handleDragStart(fileIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver(pos)}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={handleDrop(pos)}
                    onTouchStart={handleTouchStart(fileIndex)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className={`relative flex shrink-0 flex-col gap-1 transition-transform duration-100 ${
                      uploadedFiles.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${isDragging ? 'pointer-events-none z-20 scale-[0.92] opacity-70' : ''} ${
                      isDragOver && !isDragging
                        ? 'rounded-xl ring-2 ring-blue-400 ring-offset-2 ring-offset-[var(--card)]'
                        : ''
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      className="relative flex flex-col gap-1"
                    >
                      <div className="relative aspect-square w-36 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src={f.fileUrl}
                          alt=""
                          fill
                          className="pointer-events-none object-cover select-none"
                          sizes="144px"
                          draggable={false}
                        />
                        <button
                          type="button"
                          data-no-drag
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(fileIndex);
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
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
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

        {/* 피드 내용 입력만 */}
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
