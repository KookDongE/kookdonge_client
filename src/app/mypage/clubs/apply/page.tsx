'use client';

import { Suspense, useState } from 'react';
import type { Key } from 'react';
import { useRouter } from 'next/navigation';

import { ListBox, Select, Spinner } from '@heroui/react';

import { ClubCategory, ClubType, College } from '@/types/api';
import { useApplyClub } from '@/features/club/hooks';

const TYPE_OPTIONS: { value: ClubType; label: string }[] = [
  { value: 'CENTRAL', label: '중앙동아리' },
  { value: 'DEPARTMENTAL', label: '학과동아리' },
  { value: 'ACADEMIC_SOCIETY', label: '학회' },
  { value: 'CLUB', label: '소모임' },
];

const COLLEGE_OPTIONS: { value: College; label: string }[] = [
  { value: 'GLOBAL_HUMANITIES', label: '글로벌인문대학' },
  { value: 'SOCIAL_SCIENCE', label: '사회과학대학' },
  { value: 'LAW', label: '법과대학' },
  { value: 'ECONOMICS', label: '경제대학' },
  { value: 'BUSINESS', label: '경영대학' },
  { value: 'INDEPENDENT', label: '자유전공' },
  { value: 'ENGINEERING', label: '공과대학' },
  { value: 'SOFTWARE', label: '소프트웨어융합대학' },
  { value: 'AUTOMOTIVE', label: '자동차융합대학' },
  { value: 'SCIENCE', label: '과학기술대학' },
  { value: 'ARCHITECTURE', label: '건축대학' },
  { value: 'DESIGN', label: '디자인대학' },
  { value: 'ARTS', label: '예술대학' },
  { value: 'PHYSICAL_EDUCATION', label: '체육대학' },
];

const CATEGORY_OPTIONS: { value: ClubCategory; label: string }[] = [
  { value: 'PERFORMING_ARTS', label: '공연' },
  { value: 'LIBERAL_ARTS_SERVICE', label: '봉사' },
  { value: 'EXHIBITION_ARTS', label: '전시' },
  { value: 'RELIGION', label: '종교' },
  { value: 'BALL_LEISURE', label: '구기' },
  { value: 'PHYSICAL_MARTIAL_ARTS', label: '체육' },
  { value: 'ACADEMIC', label: '학술' },
];

function ClubApplyContent() {
  const router = useRouter();
  const applyClub = useApplyClub();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clubType, setClubType] = useState<ClubType | ''>('');
  const [college, setCollege] = useState<College | ''>('');
  const [category, setCategory] = useState<ClubCategory | ''>('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('동아리 이름을 입력해주세요.');
      return;
    }
    if (!description.trim()) {
      alert('신청 사유를 입력해주세요.');
      return;
    }
    if (!clubType) {
      alert('동아리유형을 선택해주세요.');
      return;
    }
    if (!college) {
      alert('과를 선택해주세요.');
      return;
    }
    if (!category) {
      alert('분야를 선택해주세요.');
      return;
    }

    applyClub.mutate(
      {
        clubName: name.trim(),
        clubType: clubType as ClubType,
        category: category as ClubCategory,
        college: college || undefined,
        description: description.trim(),
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
            disabled={!name.trim() || !description.trim() || !clubType || !college || !category || applyClub.isPending}
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

        {/* 동아리유형 · 과 · 분야 */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              동아리유형 <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="동아리유형 선택"
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
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              과 <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="과 선택"
              value={college || undefined}
              onChange={(value: Key | null) => {
                setCollege((value as College) || '');
              }}
              className="w-full"
            >
              <Select.Trigger className="rounded-xl border border-gray-200 bg-white text-sm text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {COLLEGE_OPTIONS.map((opt) => (
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
