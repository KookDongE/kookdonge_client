'use client';

import { useEffect, useState, type Key } from 'react';
import { useRouter } from 'next/navigation';

import { Input, ListBox, Select, TextArea } from '@heroui/react';
import { Reorder, useDragControls } from 'framer-motion';

import { useSystemAdmins } from '@/features/admin';
import { useMyProfile } from '@/features/auth/hooks';
import { isSystemAdmin } from '@/features/auth/permissions';
import { FormPageSkeleton } from '@/components/common/skeletons';

/** 사진 한 칸: id(Reorder용) + file + preview */
type PhotoItem = { id: string; file: File; preview: string };

/** 드래그는 밑 그립에서만 가능, 사진 영역은 그립 안 켜짐 (동아리 피드와 동일) */
function PhotoReorderItem({
  item,
  onRemove,
  canReorder,
}: {
  item: PhotoItem;
  onRemove: () => void;
  canReorder: boolean;
}) {
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
        <img
          src={item.preview}
          alt=""
          className="pointer-events-none size-full select-none object-cover"
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
          className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
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
          className="flex touch-none cursor-grab items-center justify-center gap-0.5 rounded-b-xl py-1.5 text-zinc-400 active:cursor-grabbing dark:text-zinc-500"
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
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
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
    const added: PhotoItem[] = files.slice(0, Math.max(0, 10 - photoItems.length)).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotoItems((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotoItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
      // TODO: 백엔드 API 연동 (boardType, accountKey, trimmedTitle, trimmedContent, photoItems.map(i => i.file))
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

  const canSubmit = Boolean(title.trim() && content.trim()) && !isSubmitting;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* 헤더: 동아리 신청/피드 추가와 동일 (취소 | 제목 | 작성), 외곽선 없음 */}
      <div className="shrink-0 bg-[var(--card)] text-[var(--foreground)]">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">글쓰기</h1>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canSubmit}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {isSubmitting ? '작성 중...' : '작성'}
          </button>
        </div>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4"
        onSubmit={handleSubmit}
      >
        {/* 분류 / 계정 선택 2열 */}
        <div className="grid shrink-0 grid-cols-2 gap-4">
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
        <div className="shrink-0">
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

        {/* 내용: 높이 제한 후 textarea가 영역 전체 채움 */}
        <div className="flex h-[11rem] shrink-0 flex-col">
          <label className="mb-2 shrink-0 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            내용
          </label>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl [&_textarea]:h-full [&_textarea]:min-h-0">
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="h-full w-full resize-none rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              aria-label="내용"
            />
          </div>
        </div>

        {/* 사진: 동아리 피드와 동일하게 가로 스크롤 + 드래그 순서 변경 */}
        <div className="shrink-0">
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
          {photoItems.length === 0 ? (
            <label
              htmlFor="community-write-photo"
              className="block w-36 shrink-0 cursor-pointer"
            >
              <span className="flex aspect-square w-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                <span className="text-2xl">+</span>
                <span className="text-sm font-medium">이미지 추가</span>
              </span>
            </label>
          ) : (
            <div className="drag-area-no-select -mx-4 shrink-0 overflow-x-auto overflow-y-hidden px-4 pb-2">
              <div className="flex items-center gap-3" style={{ width: 'max-content' }}>
                <Reorder.Group
                  axis="x"
                  values={photoItems}
                  onReorder={setPhotoItems}
                  className="flex items-center gap-3"
                >
                  {photoItems.map((item) => (
                    <PhotoReorderItem
                      key={item.id}
                      item={item}
                      onRemove={() => removePhoto(item.id)}
                      canReorder={photoItems.length > 1}
                    />
                  ))}
                </Reorder.Group>
                {photoItems.length < 10 && (
                  <label
                    htmlFor="community-write-photo"
                    className="block shrink-0 cursor-pointer"
                  >
                    <span className="flex aspect-square w-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-2xl text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                      +
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            최대 10장까지 첨부할 수 있습니다.
          </p>
        </div>

        {/* 내용 영역 줄인 만큼 하단 여백 */}
        <div className="min-h-[11rem] flex-1 shrink-0" aria-hidden />
      </form>
    </div>
  );
}
