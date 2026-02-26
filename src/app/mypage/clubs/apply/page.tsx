'use client';

import { Suspense, useState } from 'react';
import type { Key } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { ListBox, Select, Spinner } from '@heroui/react';

import { ClubCategory, ClubType } from '@/types/api';
import { useApplyClub } from '@/features/club/hooks';
import { useUploadFeedFiles } from '@/features/feed/hooks';

const CATEGORY_OPTIONS: { value: ClubCategory; label: string }[] = [
  { value: 'PERFORMING_ARTS', label: '공연' },
  { value: 'LIBERAL_ARTS_SERVICE', label: '봉사' },
  { value: 'EXHIBITION_ARTS', label: '전시' },
  { value: 'RELIGION', label: '종교' },
  { value: 'BALL_LEISURE', label: '구기' },
  { value: 'PHYSICAL_MARTIAL_ARTS', label: '체육' },
  { value: 'ACADEMIC', label: '학술' },
];

const TYPE_OPTIONS: { value: ClubType; label: string }[] = [
  { value: 'CENTRAL', label: '중앙동아리' },
  { value: 'DEPARTMENTAL', label: '학과동아리' },
];

function ClubApplyContent() {
  const router = useRouter();
  const applyClub = useApplyClub();
  const uploadFeedFiles = useUploadFeedFiles(0); // 동아리 신청용 clubId 임시 0
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ClubCategory | ''>('');
  const [clubType, setClubType] = useState<ClubType | ''>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFeedFiles.mutateAsync([file]);
      const fileUrl = result[0]?.fileUrl;
      if (fileUrl) setImage(fileUrl);
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('동아리 이름을 입력해주세요.');
      return;
    }
    if (!image) {
      alert('첨부 사진을 업로드해주세요.');
      return;
    }
    if (!description.trim()) {
      alert('신청 사유를 입력해주세요.');
      return;
    }
    if (!category) {
      alert('분야를 선택해주세요.');
      return;
    }
    if (!clubType) {
      alert('단과대를 선택해주세요.');
      return;
    }

    applyClub.mutate(
      {
        clubName: name.trim(),
        clubType: clubType as ClubType,
        category: category as ClubCategory,
        description: description.trim(),
        image: image ?? undefined,
      },
      {
        onSuccess: () => {
          alert('동아리 신청이 완료되었습니다. 검토 후 승인됩니다.');
          router.push('/mypage');
        },
        onError: () => {
          alert('동아리 신청에 실패했습니다.');
        },
      }
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-gray-700 dark:text-zinc-300"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">동아리 신청</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || !image || !description.trim() || !category || !clubType || applyClub.isPending}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {applyClub.isPending ? '신청 중...' : '신청'}
          </button>
        </div>
      </div>

      <div className="space-y-6 p-4 pb-32">
        {/* 동아리 이름 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            동아리 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="동아리 이름을 입력해주세요"
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-blue-500"
          />
        </div>

        {/* 첨부 사진 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            첨부 사진 <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
            id="club-image-upload"
            disabled={isUploading}
          />
          {!image ? (
            <label htmlFor="club-image-upload">
              <div className="flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500">
                {isUploading ? (
                  <Spinner size="sm" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-12 w-12 text-gray-400 dark:text-zinc-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-1.135.175 2.31 2.31 0 01-1.64 1.055l-.822 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">사진 추가</span>
                  </div>
                )}
              </div>
            </label>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image src={image} alt="동아리 사진" fill className="object-cover" sizes="100vw" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 분야 · 단과대 (가로 배치) */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              분야 <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="분야 선택"
              value={category || undefined}
              onChange={(value: Key | null) => {
                setCategory((value as ClubCategory) || '');
              }}
              className="w-full"
            >
              <Select.Trigger className="rounded-xl border border-gray-200 bg-white text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <ListBox.Item
                      key={opt.value}
                      id={opt.value}
                      textValue={opt.label}
                      className="!text-zinc-600 dark:!text-zinc-200"
                    >
                      {opt.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              단과대 <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="단과대 선택"
              value={clubType || undefined}
              onChange={(value: Key | null) => {
                setClubType((value as ClubType) || '');
              }}
              className="w-full"
            >
              <Select.Trigger className="rounded-xl border border-gray-200 bg-white text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {TYPE_OPTIONS.map((opt) => (
                    <ListBox.Item
                      key={opt.value}
                      id={opt.value}
                      textValue={opt.label}
                      className="!text-zinc-600 dark:!text-zinc-200"
                    >
                      {opt.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>

        {/* 신청 사유 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            신청 사유 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="신청 사유를 입력해주세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
            className="w-full min-h-[200px] resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function ClubApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <ClubApplyContent />
    </Suspense>
  );
}
