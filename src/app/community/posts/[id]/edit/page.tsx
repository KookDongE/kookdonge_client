'use client';

import { use, useEffect, useMemo, useState, type Key } from 'react';
import { useRouter } from 'next/navigation';

import { Input, ListBox, Select, TextArea } from '@heroui/react';
import { Reorder, useDragControls } from 'framer-motion';

import { IMAGE_ACCEPT_ATTR, validateImageFile } from '@/lib/image-upload-validation';
import { useMyProfile } from '@/features/auth/hooks';
import { usePostDetail, useUpdatePost, useManagedClubsForPost } from '@/features/community/hooks';
import { getPresignedUrl, registerFileUpload } from '@/features/community/api';
import { isClubManager, isSystemAdmin } from '@/features/auth/permissions';
import { FormPageSkeleton } from '@/components/common/skeletons';

/** 사진 한 칸: id(Reorder용) + file(신규) 또는 fileUuid(기존) + preview URL */
type PhotoItem =
  | { id: string; file: File; preview: string; fileUuid?: undefined }
  | { id: string; file?: undefined; fileUuid: string; preview: string };

/** 1장 이상일 때: 세로4:가로3 고정, 드래그 순서 변경 (글쓰기와 동일) */
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

type PageProps = { params: Promise<{ id: string }> };

export default function CommunityPostEditPage({ params }: PageProps) {
  const router = useRouter();
  const { id: idParam } = use(params);
  const id = Number(idParam);

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: postDetail, isLoading: postLoading } = usePostDetail(id);
  const updatePostMutation = useUpdatePost(id);
  const { data: managedClubs = [] } = useManagedClubsForPost();

  const [boardType, setBoardType] = useState<'promo' | 'free' | ''>('');
  const [accountKey, setAccountKey] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMine = postDetail?.mine ?? false;
  const isLeader =
    profile && postDetail?.clubId != null ? isClubManager(profile, postDetail.clubId) : false;
  const canEdit = profile ? isSystemAdmin(profile) || isMine || isLeader : false;

  useEffect(() => {
    if (postLoading || !postDetail || initialized) return;
    setTitle(postDetail.title ?? '');
    setContent(postDetail.content ?? '');
    setBoardType(postDetail.postCategory === 'PROMOTION' ? 'promo' : 'free');
    const authorKey =
      postDetail.authorType === 'ANONYMOUS'
        ? 'anonymous'
        : postDetail.authorType === 'USER'
          ? 'me'
          : postDetail.clubId != null
            ? `club-${postDetail.clubId}`
            : 'me';
    setAccountKey(authorKey);
    const urls = postDetail.imageUrls ?? [];
    const uuids = postDetail.fileUuids ?? [];
    const items: PhotoItem[] = urls.map((url, i) => ({
      id: `existing-${i}-${uuids[i] ?? url}`,
      fileUuid: uuids[i] ?? '',
      preview: url,
    }));
    setPhotoItems(items);
    setInitialized(true);
  }, [postDetail, postLoading, initialized]);

  const accountOptions = useMemo(
    () => [
      { key: 'anonymous', label: '익명' },
      { key: 'me', label: profile?.name ?? '내이름' },
      ...managedClubs.map((c) => ({ key: `club-${c.clubId}`, label: c.clubName })),
    ],
    [profile?.name, managedClubs]
  );

  useEffect(() => {
    if (profileLoading || postLoading) return;
    if (!postDetail || id <= 0) {
      router.replace('/community');
      return;
    }
    if (!canEdit) {
      router.replace(`/community/posts/${id}`);
    }
  }, [id, postDetail, canEdit, profileLoading, postLoading, router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const toAdd = files.slice(0, Math.max(0, 10 - photoItems.length));
    const added: PhotoItem[] = [];
    let firstError: string | null = null;
    for (const file of toAdd) {
      try {
        validateImageFile(file);
        added.push({
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
        });
      } catch (err) {
        if (!firstError)
          firstError =
            err instanceof Error ? err.message : '파일 형식 또는 용량을 확인해 주세요.';
      }
    }
    if (added.length > 0) setPhotoItems((prev) => [...prev, ...added]);
    if (firstError) alert(firstError);
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotoItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item && 'file' in item && item.file) URL.revokeObjectURL(item.preview);
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
      const fileUuids: string[] = [];
      for (const item of photoItems) {
        if (item.fileUuid) {
          fileUuids.push(item.fileUuid);
          continue;
        }
        if (!item.file) continue;
        const file = item.file;
        const ext = (file.name.split('.').pop()?.toLowerCase() ?? 'jpg').replace(/[^a-z]/g, '') || 'jpg';
        const contentType = file.type || 'image/jpeg';
        const res = await getPresignedUrl(file.name, contentType);
        const uuid = res.uuid;
        const presignedUrl = res.presignedUrl;
        if (!uuid || !presignedUrl) throw new Error('Presigned URL 응답 오류');
        const putRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType },
        });
        if (!putRes.ok) throw new Error('이미지 업로드 실패');
        await registerFileUpload({
          uuid,
          fileName: file.name,
          fileSize: file.size,
          extension: ext,
        });
        fileUuids.push(uuid);
      }
      updatePostMutation.mutate(
        {
          title: trimmedTitle,
          content: trimmedContent,
          fileUuids: fileUuids.length > 0 ? fileUuids : undefined,
        },
        {
          onSuccess: () => router.push(`/community/posts/${id}`),
          onError: (e) => alert(e?.message ?? '수정에 실패했습니다.'),
          onSettled: () => setIsSubmitting(false),
        }
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  if (profileLoading || postLoading || (id > 0 && !postDetail)) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900">
        <FormPageSkeleton />
      </div>
    );
  }

  if (!postDetail || !canEdit) {
    return null;
  }

  const canSubmit = Boolean(title.trim() && content.trim()) && !isSubmitting;

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-white dark:bg-zinc-900">
      <div className="shrink-0 bg-[var(--card)] text-[var(--foreground)]">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-[var(--foreground)] opacity-90 hover:opacity-100"
          >
            취소
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">글 수정</h1>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canSubmit}
            className="text-base font-semibold text-blue-500 disabled:opacity-50 dark:text-blue-400"
          >
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
        onSubmit={handleSubmit}
      >
        {/* 분류 / 계정 선택 (읽기 전용 표시, 글쓰기와 동일 레이아웃) */}
        <div className="flex shrink-0 items-center gap-2">
          <Select
            aria-label="분류"
            placeholder="분류"
            value={boardType || undefined}
            onChange={(value: Key | null) => value && setBoardType(value as 'promo' | 'free')}
            className="shrink-0"
            isDisabled
          >
            <Select.Trigger className="max-w-[100px] min-w-[100px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
              <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
              <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[
                  { value: 'promo', label: '홍보' },
                  { value: 'free', label: '자유' },
                ].map((opt) => (
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

          <Select
            aria-label="계정"
            placeholder="계정 선택"
            value={accountKey || undefined}
            onChange={(value: Key | null) => value && setAccountKey(String(value))}
            className="shrink-0"
            isDisabled
          >
            <Select.Trigger className="max-w-[100px] min-w-[100px] rounded-full border border-zinc-300 bg-zinc-50 text-xs !text-zinc-700 ring-0 outline-none focus:ring-0 focus-visible:ring-0 dark:border-zinc-600 dark:bg-zinc-800 dark:!text-zinc-200 [&[data-focus]]:ring-0">
              <Select.Value className="[color:rgb(82,82,91)] dark:[color:rgb(228,228,231)]" />
              <Select.Indicator className="!text-zinc-500 dark:!text-zinc-400" />
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

        <div className="shrink-0">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full rounded-lg border border-zinc-200 bg-white text-gray-900 placeholder-gray-400 shadow-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            aria-label="제목"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg [&_textarea]:min-h-0 [&_textarea]:h-full">
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="size-full min-h-0 flex-1 resize-none rounded-lg border border-zinc-200 bg-white text-gray-900 placeholder-gray-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              aria-label="내용"
            />
          </div>
        </div>

        <div className="shrink-0 mb-0">
          <input
            type="file"
            accept={IMAGE_ACCEPT_ATTR}
            multiple
            onChange={handlePhotoChange}
            className="hidden"
            id="community-edit-photo"
          />
          {photoItems.length === 0 ? (
            <label htmlFor="community-edit-photo" className="block w-36 shrink-0 cursor-pointer">
              <span className="flex aspect-square w-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                <img src="/icons/stash_image-open-light.svg" alt="" className="h-12 w-12" />
              </span>
            </label>
          ) : (
            <div className="drag-area-no-select no-scrollbar -mx-4 shrink-0 overflow-x-auto overflow-y-hidden px-4 pb-2">
              <div className="flex items-start gap-3" style={{ width: 'max-content' }}>
                <Reorder.Group
                  axis="x"
                  values={photoItems}
                  onReorder={setPhotoItems}
                  className="flex items-start gap-3"
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
                    htmlFor="community-edit-photo"
                    className="block shrink-0 cursor-pointer"
                  >
                    <span className="flex aspect-square w-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700/80">
                      <img src="/icons/stash_image-open-light.svg" alt="" className="h-12 w-12" />
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
      </form>
    </div>
  );
}
