'use client';

import { useEffect, useState, type Key } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Input, ListBox, Select, TextArea } from '@heroui/react';

import { useSystemAdmins } from '@/features/admin';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { FormPageSkeleton } from '@/components/common/skeletons';

/** 글쓰기 분류: 홍보/자유만 (인기는 목록만) */
const BOARD_TYPE_OPTIONS: { value: 'promo' | 'free'; label: string }[] = [
  { value: 'promo', label: '홍보' },
  { value: 'free', label: '자유' },
];

export default function CommunityWritePage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: admins = [] } = useSystemAdmins();

  const [boardType, setBoardType] = useState<'promo' | 'free'>('free');
  const [accountKey, setAccountKey] = useState<string>('me');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isSystemAdmin(profile)) {
      router.replace('/home');
    }
  }, [profile, profileLoading, router]);

  const accountOptions = [
    { key: 'me', label: profile ? profile.name || profile.email || '내 계정' : '내 계정' },
    ...admins.map((a) => ({ key: String(a.userId), label: a.name || a.email })),
  ];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newFiles = [...photoFiles, ...files].slice(0, 10);
    setPhotoFiles(newFiles);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    photoPreviews.forEach(URL.revokeObjectURL);
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (index: number) => {
    const nextFiles = photoFiles.filter((_, i) => i !== index);
    const nextPreviews = photoPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(photoPreviews[index] ?? '');
    setPhotoFiles(nextFiles);
    setPhotoPreviews(nextPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!trimmedContent) {
      alert('내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: 백엔드 API 연동 (boardType, accountKey, trimmedTitle, trimmedContent, photoFiles)
      await new Promise((r) => setTimeout(r, 500));
      alert('글이 등록되었습니다. (현재 목 데이터)');
      router.push('/admin/community');
    } catch {
      alert('등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || (profile && !isSystemAdmin(profile))) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900">
      <form className="space-y-4 px-4 py-4 pb-0" onSubmit={handleSubmit}>
        {/* 분류 / 계정 선택 2열 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              분류
            </label>
            <Select
              aria-label="분류 선택"
              placeholder="분류"
              value={boardType}
              onChange={(value: Key | null) => value && setBoardType(value as 'promo' | 'free')}
              className="w-full"
            >
              <Select.Trigger className="rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {BOARD_TYPE_OPTIONS.map((opt) => (
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

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              계정 선택
            </label>
            <Select
              aria-label="계정 선택"
              placeholder="계정"
              value={accountKey}
              onChange={(value: Key | null) => value && setAccountKey(String(value))}
              className="w-full"
            >
              <Select.Trigger className="rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {accountOptions.map((opt) => (
                    <ListBox.Item
                      key={opt.key}
                      id={opt.key}
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

        {/* 제목 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            제목
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label="제목"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            내용
          </label>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={6}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label="내용"
          />
        </div>

        {/* 사진 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            사진
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="hidden"
            id="community-write-photo"
          />
          <div className="flex flex-wrap gap-2">
            {photoPreviews.map((url, i) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`첨부 ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-white dark:bg-zinc-200 dark:text-zinc-800"
                  aria-label={`사진 ${i + 1} 제거`}
                >
                  ×
                </button>
              </div>
            ))}
            {photoPreviews.length < 10 && (
              <label
                htmlFor="community-write-photo"
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-600 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
              >
                <span className="text-2xl">+</span>
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            최대 10장까지 첨부할 수 있습니다.
          </p>
        </div>

        {/* 작성 버튼 */}
        <Button
          type="submit"
          variant="primary"
          className="w-full font-medium"
          isDisabled={isSubmitting}
          isPending={isSubmitting}
        >
          작성
        </Button>
      </form>
    </div>
  );
}
