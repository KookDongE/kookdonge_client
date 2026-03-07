'use client';

import { Suspense, use, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { Button, Chip, ListBox, Select, Spinner, Tabs, TextArea } from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, ClubDetailRes, ClubType, College, RecruitmentStatus } from '@/types/api';
import { formatQnaDateTime, parseApiIsoToDate } from '@/lib/utils';
import {
  useAddClubAdmin,
  useClubDetail,
  useClubMembers,
  useRemoveClubAdmin,
  useUpdateClubDetail,
  useUpdateRecruitmentInfo,
} from '@/features/club/hooks';
import { clubApi } from '@/features/club/api';
import { IMAGE_ACCEPT_ATTR, validateImageFile } from '@/lib/image-upload-validation';
import { useClubFeeds, useUploadFeedFiles } from '@/features/feed/hooks';
import { useAddInterest, useMyInterests, useRemoveInterest } from '@/features/interest/hooks';
import {
  useCreateAnswer,
  useDeleteQuestion,
  usePendingQuestions,
  useQuestions,
} from '@/features/question/hooks';
import {
  useAddToWaitingList,
  useMyWaitingList,
  useRemoveFromWaitingList,
} from '@/features/waiting-list/hooks';
import { DefaultClubImage } from '@/components/common/default-club-image';
import { usePullToRefreshActive } from '@/components/common/pull-to-refresh';
import {
  FeedItemSkeleton,
  FormPageSkeleton,
  ListCardSkeleton,
} from '@/components/common/skeletons';
import { FeedCoverImage } from '@/components/feed/feed-cover-image';
import { BellIcon } from '@/components/icons/notification-icon';

const CATEGORY_LABEL: Record<ClubCategory, string> = {
  PERFORMING_ARTS: '공연예술',
  LIBERAL_ARTS_SERVICE: '교양봉사',
  EXHIBITION_ARTS: '전시창작',
  RELIGION: '종교',
  BALL_LEISURE: '구기레저',
  PHYSICAL_MARTIAL_ARTS: '체육무예',
  ACADEMIC: '학술',
};

const TYPE_LABEL: Record<ClubType, string> = {
  CENTRAL: '중앙동아리',
  DEPARTMENTAL: '학과동아리',
  ACADEMIC_SOCIETY: '학회',
  CLUB: '소모임',
};

const COLLEGE_LABEL: Record<College, string> = {
  GLOBAL_HUMANITIES: '글로벌인문지역대학',
  SOCIAL_SCIENCE: '사회과학대학',
  LAW: '법과대학',
  ECONOMICS: '경상대학',
  BUSINESS: '경영대학',
  FREE_MAJOR: '자유전공',
  ENGINEERING: '창의공과대학',
  SOFTWARE: '소프트웨어융합대학',
  AUTOMOTIVE: '자동차융합대학',
  SCIENCE: '과학기술대학',
  ARCHITECTURE: '건축대학',
  DESIGN: '조형대학',
  ARTS: '예술대학',
  PHYSICAL_EDUCATION: '체육대학',
  FUTURE_MOBILITY: '미래모빌리티학과',
  LIBERAL_ARTS: '교양대학',
};

const STATUS_CONFIG: Record<
  RecruitmentStatus,
  { label: string; color: 'success' | 'accent' | 'default'; className: string }
> = {
  RECRUITING: {
    label: '모집중',
    color: 'success',
    className: 'bg-lime-200 text-zinc-800 dark:bg-lime-500/70 dark:text-zinc-900',
  },
  SCHEDULED: {
    label: '모집예정',
    color: 'accent',
    className: 'bg-cyan-200 text-zinc-800 dark:bg-cyan-500/70 dark:text-zinc-900',
  },
  CLOSED: {
    label: '모집마감',
    color: 'default',
    className: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400',
  },
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
  value: value as ClubCategory,
  label,
}));

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({
  value: value as ClubType,
  label,
}));

const KST = 'Asia/Seoul';

function _formatDate(dateString: string | null | undefined): string {
  if (dateString == null || dateString === '') return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear() % 100;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/** 모집기간 읽기 모드: 한국 시간으로 날짜+시간 표시 */
function formatDateTimeReadMode(dateString: string | null | undefined): string {
  const date = parseApiIsoToDate(dateString);
  if (!date) return '-';
  return date.toLocaleString('ko-KR', {
    timeZone: KST,
    year: '2-digit',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** API ISO 문자열을 한국 시간(KST) 기준 날짜(YYYY-MM-DD)와 시간(HH:mm)으로 반환 */
function parseIsoToKstDateAndTime(iso: string | null | undefined): { date: string; time: string } {
  const d = parseApiIsoToDate(iso);
  if (!d) return { date: '', time: '00:00' };
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: KST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return { date: dateStr, time: timeStr };
}

/** 사용자 입력(한국 시간)을 ISO 문자열(UTC)로 변환해 API에 전달 */
function kstToIso(date: string, time: string): string {
  if (!date || !time) return '';
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

/** 모집 시간을 1시간 단위로만 사용 (HH:00) */
function toHourOnly(timeStr: string | undefined): string {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return '00:00';
  const [h] = timeStr.split(':');
  const hour = Math.min(23, Math.max(0, parseInt(h, 10)));
  return `${String(hour).padStart(2, '0')}:00`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

/** 동아리 상세 페이지와 동일한 보기용: externalLink 문자열 파싱 */
function parseExternalLinks(externalLink: string | undefined): { name: string; url: string }[] {
  if (!externalLink || typeof externalLink !== 'string') return [];
  const trimmed = externalLink.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (x): x is { name: string; url: string } =>
            x != null &&
            typeof x === 'object' &&
            typeof (x as { url?: string }).url === 'string' &&
            (x as { url: string }).url.trim() !== ''
        )
        .map((x) => ({ name: x.name ?? '', url: (x.url as string).trim() }));
    }
  } catch {
    // single URL
  }
  if (/^https?:\/\//i.test(trimmed)) return [{ name: '', url: trimmed }];
  return [];
}

function getFaviconUrlForView(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
  } catch {
    return '';
  }
}

function getLinkDisplayNameForView(item: { name: string; url: string }): string {
  if (item.name.trim()) return item.name.trim();
  try {
    return new URL(item.url).hostname.replace(/^www\./, '');
  } catch {
    return item.url;
  }
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
};

function ClubManageContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('info'));
  const isPullActive = usePullToRefreshActive();
  const [highlightQuestionId, setHighlightQuestionId] = useQueryState(
    'questionId',
    parseAsString.withDefault('')
  );
  const { data: club, isLoading, isError: clubError } = useClubDetail(clubId);
  const updateClub = useUpdateClubDetail();
  const updateRecruitmentInfo = useUpdateRecruitmentInfo();
  const { data: interests } = useMyInterests();
  const addInterest = useAddInterest();
  const removeInterest = useRemoveInterest();
  const { data: subscriptions } = useMyWaitingList();
  const addNotification = useAddToWaitingList();
  const removeNotification = useRemoveFromWaitingList();

  const isInterestedByMe = (interests ?? []).some((s) => s.clubId === clubId);
  const isNotificationOn = (subscriptions ?? []).some((s) => s.clubId === clubId);

  // 없는 동아리 또는 잘못된 id → 홈으로
  useEffect(() => {
    if (Number.isNaN(clubId) || clubId < 1) {
      router.replace('/home');
      return;
    }
    if (clubError || (!isLoading && !club)) {
      router.replace('/home');
    }
  }, [clubId, clubError, isLoading, club, router]);

  const handleInterestedToggle = () => {
    if (addInterest.isPending || removeInterest.isPending) return;
    if (isInterestedByMe) {
      removeInterest.mutate(clubId);
    } else {
      addInterest.mutate(clubId);
    }
  };

  const handleNotificationToggle = () => {
    if (addNotification.isPending || removeNotification.isPending) return;
    if (isNotificationOn) {
      removeNotification.mutate(clubId);
    } else {
      addNotification.mutate(clubId);
    }
  };

  // 진입·동아리 변경 시 스크롤을 맨 위로 (같은 동아리 재진입 시에도 pathname으로 실행)
  useLayoutEffect(() => {
    const scrollEl = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    if (scrollEl) scrollEl.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [clubId, pathname]);

  // 정보 탭: 기본은 보기 모드(동아리 상세와 동일), 각 영역 우측 상단 연필로 수정 모드 전환
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingRecruitment, setIsEditingRecruitment] = useState(false);

  // 파일 업로드 (프로필/설명 이미지)
  const uploadFeedFiles = useUploadFeedFiles(clubId);
  const [profileFileUuid, setProfileFileUuid] = useState<string | null>(null);

  // 폼 상태
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<ClubCategory>('ACADEMIC');
  const [type, setType] = useState<ClubType>('CENTRAL');
  const [targetGraduate, setTargetGraduate] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [location, setLocation] = useState('');
  /** 1~7 = 주 N회, null = 기타(직접 입력) */
  const [weeklyActiveFrequency, setWeeklyActiveFrequency] = useState<number | null>(1);
  const [weeklyActivityOther, setWeeklyActivityOther] = useState('');
  const [allowLeaveOfAbsence, setAllowLeaveOfAbsence] = useState(false);
  const [content, setContent] = useState('');
  const [_description, setDescription] = useState('');
  /** 동아리 소개 대표 이미지 1장 (URL, 프로필과 동일한 업로드 흐름) */
  const [contentImage, setContentImage] = useState('');
  /** 동아리 소개 이미지 UUID (PUT /content 시 서버에 전달) */
  const [contentFileUuid, setContentFileUuid] = useState<string | null>(null);
  const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>('RECRUITING');
  const [recruitmentStartDate, setRecruitmentStartDate] = useState('');
  const [recruitmentStartTime, setRecruitmentStartTime] = useState('00:00');
  const [recruitmentEndDate, setRecruitmentEndDate] = useState('');
  const [recruitmentEndTime, setRecruitmentEndTime] = useState('23:59');
  const [recruitmentUrl, setRecruitmentUrl] = useState('');
  /** 외부 링크 (이름, URL). API에는 JSON 문자열로 저장 */
  const [externalLinks, setExternalLinks] = useState<{ name: string; url: string }[]>([]);

  // 데이터 로드 시 폼 초기화 (동아리 변경 시 폼 리셋)
  /* eslint-disable react-hooks/set-state-in-effect -- 폼 초기값을 서버 데이터와 동기화 */
  useEffect(() => {
    if (!club || isLoading) return;
    setName(club.name || '');
    setImage(club.image || '');
    setSummary((club.summary ?? club.description) || '');
    setCategory(club.category);
    setType(club.type);
    setTargetGraduate(club.targetGraduate || '');
    setLeaderName(club.leaderName || '');
    setLocation(club.location || '');
    const w = club.weeklyActivity ?? (club.weeklyActiveFrequency != null ? String(club.weeklyActiveFrequency) : '');
    const trimmed = String(w).trim();
    if (trimmed && /^[1-7]$/.test(trimmed)) {
      setWeeklyActiveFrequency(Number(trimmed));
      setWeeklyActivityOther('');
    } else {
      setWeeklyActiveFrequency(trimmed ? null : 1);
      setWeeklyActivityOther(trimmed && !/^[1-7]$/.test(trimmed) ? trimmed : '');
    }
    setAllowLeaveOfAbsence(club.allowLeaveOfAbsence ?? false);
    setContent(club.content || '');
    setDescription(club.description || '');
    setContentImage(club.contentImageUrl ?? club.descriptionImages?.[0] ?? '');
    setRecruitmentStatus(club.recruitmentStatus);
    const startKst = parseIsoToKstDateAndTime(club.recruitmentStartDate);
    setRecruitmentStartDate(startKst.date);
    setRecruitmentStartTime(startKst.time ? toHourOnly(startKst.time) : '00:00');
    const endKst = parseIsoToKstDateAndTime(club.recruitmentEndDate);
    setRecruitmentEndDate(endKst.date);
    setRecruitmentEndTime(endKst.time ? toHourOnly(endKst.time) : '23:59');
    setRecruitmentUrl(club.applicationLink || club.recruitmentUrl || '');
    const raw = club.externalLink?.trim();
    if (!raw) {
      setExternalLinks([]);
    } else {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setExternalLinks(
            parsed
              .filter(
                (x): x is { name: string; url: string } =>
                  x != null &&
                  typeof x === 'object' &&
                  typeof (x as { url?: string }).url === 'string'
              )
              .map((x) => ({ name: x.name ?? '', url: (x.url as string).trim() }))
              .filter((x) => x.url !== '')
          );
        } else {
          setExternalLinks([]);
        }
      } catch {
        if (/^https?:\/\//i.test(raw)) {
          setExternalLinks([{ name: '', url: raw }]);
        } else {
          setExternalLinks([]);
        }
      }
    }
  }, [club, isLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (Number.isNaN(clubId) || clubId < 1 || clubError || !club) {
    return (
      <div className="min-h-screen">
        <FormPageSkeleton />
      </div>
    );
  }

  const handleSaveBasic = async () => {
    const linkPayload = externalLinks.filter((e) => e.url.trim());
    const weeklyActivityValue =
      weeklyActiveFrequency != null ? String(weeklyActiveFrequency) : weeklyActivityOther.trim();
    updateClub.mutate(
      {
        clubId,
        data: {
          name,
          image,
          summary,
          category,
          type,
          targetGraduate,
          leaderName,
          location,
          ...(weeklyActivityValue !== '' ? { weeklyActivity: weeklyActivityValue } : {}),
          allowLeaveOfAbsence,
          profileFileUuid: profileFileUuid ?? undefined,
          externalLink: linkPayload.length > 0 ? JSON.stringify(linkPayload) : '',
        },
      },
      {
        onSuccess: () => {
          setIsEditingBasic(false);
          alert('기본 정보가 저장되었습니다.');
        },
      }
    );
  };

  const handleImageUpload = async (file: File) => {
    try {
      validateImageFile(file);
    } catch (e) {
      alert(e instanceof Error ? e.message : '파일 형식 또는 용량을 확인해 주세요.');
      return;
    }
    try {
      const result = await uploadFeedFiles.mutateAsync([file]);
      if (result[0]) {
        setImage(result[0].fileUrl);
        setProfileFileUuid(result[0].uuid);
      }
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleSaveContent = async () => {
    updateClub.mutate(
      {
        clubId,
        data: {
          content,
          contentFileUuid: contentFileUuid ?? undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditingContent(false);
          alert('상세 정보가 저장되었습니다.');
        },
      }
    );
  };

  /** 동아리 소개 이미지 1장 업로드 (프로필 이미지와 동일: Presigned URL → S3 → POST /files → UUID 저장) */
  const handleContentImageUpload = async (file: File) => {
    try {
      validateImageFile(file);
    } catch (e) {
      alert(e instanceof Error ? e.message : '파일 형식 또는 용량을 확인해 주세요.');
      return;
    }
    try {
      const result = await uploadFeedFiles.mutateAsync([file]);
      if (result[0]) {
        setContentImage(result[0].fileUrl);
        setContentFileUuid(result[0].uuid);
      }
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleSaveRecruitment = () => {
    if (
      !recruitmentStartDate ||
      !recruitmentEndDate ||
      !recruitmentStartTime ||
      !recruitmentEndTime
    ) {
      alert('모집 시작일·종료일과 시작·종료 시간을 모두 입력해 주세요.');
      return;
    }
    const recruitmentStartTimeApi = kstToIso(recruitmentStartDate, recruitmentStartTime);
    const recruitmentEndTimeApi = kstToIso(recruitmentEndDate, recruitmentEndTime);
    if (!recruitmentStartTimeApi || !recruitmentEndTimeApi) {
      alert('모집 시작일·종료일과 시작·종료 시간을 모두 입력해 주세요.');
      return;
    }
    const startDate = new Date(recruitmentStartTimeApi);
    const endDate = new Date(recruitmentEndTimeApi);
    if (endDate < startDate) {
      alert('모집 종료일은 모집 시작일보다 빠를 수 없습니다.');
      return;
    }
    updateRecruitmentInfo.mutate(
      {
        clubId,
        recruitmentStartTime: recruitmentStartTimeApi,
        recruitmentEndTime: recruitmentEndTimeApi,
        applicationLink: recruitmentUrl?.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsEditingRecruitment(false);
          alert('모집 정보가 저장되었습니다.');
        },
      }
    );
  };

  const status = STATUS_CONFIG[club.recruitmentStatus];

  return (
    <>
      {/* 스크롤 시 상단 고정: 헤더 + 탭 리스트 (동아리 상세페이지와 동일, 기본정보/동아리소개/모집정보/관리자 제외) */}
      <div className="sticky top-0 z-30 bg-[var(--card)]">
        {/* 헤더 - 동아리 상세페이지와 동일: 태그=사진 상단, 이름=태그 아래, 아이콘=사진 하단 우측 1열 */}
        <div className="bg-white px-4 py-6 dark:bg-zinc-900">
          <div className="flex gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm dark:bg-zinc-800">
              {club.image ? (
                <Image
                  src={club.image}
                  alt={club.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <DefaultClubImage className="object-cover" sizes="112px" />
              )}
            </div>
            <div className="flex min-h-28 flex-1 flex-col">
              {/* 태그: 사진 상단과 맞춤 */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}
                >
                  {status.label}
                </span>
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {TYPE_LABEL[club.type]}
                </span>
                {club.type === 'DEPARTMENTAL' && club.college && (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {COLLEGE_LABEL[club.college]}
                  </span>
                )}
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {CATEGORY_LABEL[club.category]}
                </span>
              </div>
              {/* 동아리 이름: 태그 바로 아래 */}
              <h1 className="mt-1.5 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {club.name}
              </h1>
              {(club.summary ?? club.description) && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {club.summary ?? club.description}
                </p>
              )}
              {/* 관심, 알림, 좋아요(숫자), 조회수(숫자): 사진 하단 우측 1열 */}
              <div className="mt-auto flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleInterestedToggle}
                  disabled={addInterest.isPending || removeInterest.isPending}
                  className={`rounded-lg p-1.5 transition-colors active:scale-95 ${
                    isInterestedByMe
                      ? 'bg-amber-100 dark:bg-amber-500/20'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title="관심 동아리"
                  aria-label={isInterestedByMe ? '관심 해제' : '관심 등록'}
                >
                  <StarIcon
                    filled={isInterestedByMe}
                    className={`h-4 w-4 shrink-0 ${isInterestedByMe ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  disabled={addNotification.isPending || removeNotification.isPending}
                  className={`rounded-lg p-1.5 transition-colors active:scale-95 ${
                    isNotificationOn
                      ? 'bg-sky-100 dark:bg-sky-500/20'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title={isNotificationOn ? '모집 알림 해제' : '모집 알림 받기'}
                  aria-label={isNotificationOn ? '알림 해제' : '알림 받기'}
                >
                  <div
                    className={`flex items-center justify-center ${isNotificationOn ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                  >
                    <BellIcon className="h-4 w-4 shrink-0" />
                  </div>
                </button>
                <div
                  className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-red-500 dark:text-red-400"
                  aria-label={`좋아요 ${club.totalLikeCount}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4 shrink-0"
                    aria-hidden
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span className="text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
                    {club.totalLikeCount}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-zinc-500 dark:text-zinc-400"
                  aria-label={`조회수 ${club.totalViewCount}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4 shrink-0"
                    aria-hidden
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="text-xs tabular-nums">{club.totalViewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 리스트 (고정 영역에 포함) */}
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(key as string)}
          className="w-full min-w-0"
        >
          <Tabs.ListContainer className="bg-[var(--card)] px-4">
            <Tabs.List aria-label="동아리 정보" className="flex w-full">
              <Tabs.Tab
                id="info"
                className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                정보
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab
                id="feed"
                className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                피드
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab
                id="qna"
                className="flex-1 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Q&A
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          {/* 정보 탭: 기본은 조회 페이지와 동일 보기, 각 영역 우측 상단 연필로 수정 모드 전환, 관리자 영역 항상 표시 */}
          <Tabs.Panel id="info" className="w-full min-w-0 overflow-hidden">
            <ClubInfoTab
              club={club}
              clubId={clubId}
              isEditingBasic={isEditingBasic}
              isEditingContent={isEditingContent}
              isEditingRecruitment={isEditingRecruitment}
              onEditBasic={() => setIsEditingBasic(true)}
              onEditContent={() => setIsEditingContent(true)}
              onEditRecruitment={() => setIsEditingRecruitment(true)}
              onCancelBasic={() => setIsEditingBasic(false)}
              onCancelContent={() => setIsEditingContent(false)}
              onCancelRecruitment={() => setIsEditingRecruitment(false)}
              onSaveBasic={handleSaveBasic}
              onSaveContent={handleSaveContent}
              onSaveRecruitment={handleSaveRecruitment}
              name={name}
              setName={setName}
              image={image}
              onImageUpload={handleImageUpload}
              summary={summary}
              setSummary={setSummary}
              category={category}
              setCategory={setCategory}
              type={type}
              setType={setType}
              targetGraduate={targetGraduate}
              setTargetGraduate={setTargetGraduate}
              leaderName={leaderName}
              setLeaderName={setLeaderName}
              location={location}
              setLocation={setLocation}
              weeklyActiveFrequency={weeklyActiveFrequency}
              setWeeklyActiveFrequency={setWeeklyActiveFrequency}
              weeklyActivityOther={weeklyActivityOther}
              setWeeklyActivityOther={setWeeklyActivityOther}
              allowLeaveOfAbsence={allowLeaveOfAbsence}
              setAllowLeaveOfAbsence={setAllowLeaveOfAbsence}
              content={content}
              setContent={setContent}
              contentImage={contentImage}
              setContentImage={setContentImage}
              onContentImageUpload={handleContentImageUpload}
              contentFileUuid={contentFileUuid}
              setContentFileUuid={setContentFileUuid}
              recruitmentStatus={recruitmentStatus}
              setRecruitmentStatus={setRecruitmentStatus}
              recruitmentStartDate={recruitmentStartDate}
              setRecruitmentStartDate={setRecruitmentStartDate}
              recruitmentStartTime={recruitmentStartTime}
              setRecruitmentStartTime={setRecruitmentStartTime}
              recruitmentEndDate={recruitmentEndDate}
              setRecruitmentEndDate={setRecruitmentEndDate}
              recruitmentEndTime={recruitmentEndTime}
              setRecruitmentEndTime={setRecruitmentEndTime}
              recruitmentUrl={recruitmentUrl}
              setRecruitmentUrl={setRecruitmentUrl}
              externalLinks={externalLinks}
              setExternalLinks={setExternalLinks}
              isUploading={uploadFeedFiles.isPending}
              isSaving={updateClub.isPending || updateRecruitmentInfo.isPending}
            />
          </Tabs.Panel>

          {/* 피드 탭 */}
          <Tabs.Panel id="feed">
            <ClubFeedTab clubId={clubId} />
          </Tabs.Panel>

          {/* Q&A 탭 */}
          <Tabs.Panel id="qna">
            <ClubQnaTab
              clubId={clubId}
              highlightQuestionId={highlightQuestionId}
              onClearHighlightQuestionId={() => setHighlightQuestionId('')}
            />
          </Tabs.Panel>
        </Tabs>
      </div>

      {/* 피드 탭에서만 노출: 피드 추가 플로팅 버튼 (지원하기·글쓰기와 동일 UI). 풀투리프레시 중에는 숨김 */}
      {tab === 'feed' && !isPullActive && (
        <div
          className="fixed right-4 bottom-[calc(4rem+2.5rem+env(safe-area-inset-bottom,0px))] z-[100] rounded-full bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95"
          aria-hidden
        >
          <Button
            size="sm"
            className="min-w-0 rounded-full px-4 py-2 text-sm font-semibold"
            variant="primary"
            onPress={() => router.push(`/mypage/clubs/${clubId}/manage/feed/new`)}
          >
            피드 추가
          </Button>
        </div>
      )}

      {/* 하단 네비 공간 확보 */}
      <div className="h-32" />
    </>
  );
}

function AdminManageSection({
  clubId,
  onClose: _onClose,
}: {
  clubId: number;
  onClose: () => void;
}) {
  const { data: members, isLoading } = useClubMembers(clubId);
  const addAdmin = useAddClubAdmin();
  const removeAdmin = useRemoveClubAdmin();
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if (!newAdminEmail.includes('@')) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    addAdmin.mutate(
      { clubId, email: newAdminEmail.trim() },
      {
        onSuccess: () => {
          setNewAdminEmail('');
          alert('관리자가 추가되었습니다.');
        },
      }
    );
  };

  const handleRemoveAdmin = (email: string) => {
    if (confirm(`정말 해당 관리자 권한을 제거하시겠습니까?`)) {
      removeAdmin.mutate({ clubId, email });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          관리자 추가
        </label>
        <div className="relative flex min-h-0 w-full rounded-xl border border-zinc-200 bg-gray-50 dark:border-zinc-600 dark:bg-zinc-800/50">
          <input
            type="email"
            placeholder="admin@kookmin.ac.kr"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="min-h-[2.5rem] w-full min-w-0 rounded-xl border-0 bg-transparent py-2 pr-14 pl-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-400"
          />
          <Button
            variant="primary"
            size="sm"
            onPress={handleAddAdmin}
            isPending={addAdmin.isPending}
            isDisabled={!newAdminEmail.trim()}
            className="absolute top-1/2 right-1.5 shrink-0 -translate-y-1/2"
          >
            추가
          </Button>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          현재 관리자 목록
        </label>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <div className="club-manage-admin-empty rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            관리자가 없습니다.
          </div>
        ) : (
          <div className="club-manage-admin-list space-y-2">
            {members.map((member) => (
              <div
                key={member.userId}
                className="club-manage-admin-item flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {member.name || '(이름 없음)'}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {member.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => handleRemoveAdmin(member.email)}
                  isPending={removeAdmin.isPending}
                >
                  제거
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 동아리 상세 페이지(/clubs/[id]) 정보 탭과 동일한 보기 전용 UI */
function ManageInfoView({
  club,
  onEdit,
}: {
  club: ClubDetailRes;
  onEdit: () => void;
}) {
  const infoItems = [
    { label: '모집 시작', value: formatDateTimeReadMode(club.recruitmentStartDate) },
    { label: '모집 마감', value: formatDateTimeReadMode(club.recruitmentEndDate) },
    { label: '대상', value: club.targetGraduate ?? '-' },
    { label: '동아리장', value: club.leaderName ?? '-' },
    ...(club.location?.trim()
      ? [{ label: '활동 장소' as const, value: club.location }]
      : []),
    {
      label: '주간활동 횟수',
      value:
        club.weeklyActivity ??
        (club.weeklyActiveFrequency != null ? `${club.weeklyActiveFrequency}회` : '-'),
    },
    { label: '휴학생 지원 가능', value: club.allowLeaveOfAbsence ? '가능' : '불가능' },
  ];

  const contentImageUrl = club.contentImageUrl ?? club.descriptionImages?.[0];
  const hasIntroduction =
    (club.content != null && club.content.trim() !== '') || !!contentImageUrl;
  const links = parseExternalLinks(club.externalLink);

  return (
    <div className="min-w-0 space-y-4 p-4">
      <div className="mb-2 flex justify-end">
        <Button size="sm" variant="primary" onPress={onEdit}>
          수정
        </Button>
      </div>
      {hasIntroduction && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-3 px-4 pt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            동아리 소개
          </h3>
          {contentImageUrl && (
            <div className="relative mx-4 mb-4 w-[calc(100%-2rem)] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contentImageUrl}
                alt="동아리 소개"
                className="h-auto w-full rounded-lg object-contain"
              />
            </div>
          )}
          {club.content != null && club.content.trim() !== '' && (
            <div className="p-4">
              <p className="whitespace-pre-wrap text-sm font-light leading-relaxed text-zinc-700 dark:text-zinc-300">
                {club.content}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">기본 정보</h3>
        <div className="min-w-0 space-y-3">
          {infoItems.map((item) => {
            const isRecruitmentDate = item.label === '모집 시작' || item.label === '모집 마감';
            return (
              <div
                key={item.label}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-0 text-sm"
              >
                <span className="shrink-0 pt-0.5 text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </span>
                <span
                  className={`min-w-0 text-right font-normal text-zinc-700 dark:text-zinc-300 ${
                    isRecruitmentDate ? 'break-words' : 'truncate'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {links.length > 0 && (
        <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">외부 링크</h3>
          <ul className="space-y-2">
            {links.map((item, i) => (
              <li key={`${item.url}-${i}`}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg py-1.5 pr-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                >
                  {getFaviconUrlForView(item.url) ? (
                    <Image
                      src={getFaviconUrlForView(item.url)}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 rounded object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded bg-zinc-200 dark:bg-zinc-600" />
                  )}
                  <span className="min-w-0 truncate text-sm font-normal text-zinc-600 dark:text-zinc-400">
                    {getLinkDisplayNameForView(item)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClubInfoTab({
  club,
  clubId,
  // 편집 상태
  isEditingBasic,
  isEditingContent,
  isEditingRecruitment,
  // 편집 모드 토글
  onEditBasic,
  onEditContent,
  onEditRecruitment,
  onCancelBasic,
  onCancelContent,
  onCancelRecruitment,
  // 저장 핸들러
  onSaveBasic,
  onSaveContent,
  onSaveRecruitment,
  // 폼 상태
  name,
  setName,
  image,
  onImageUpload,
  summary,
  setSummary,
  category,
  setCategory,
  type,
  setType,
  targetGraduate,
  setTargetGraduate,
  leaderName,
  setLeaderName,
  location,
  setLocation,
  weeklyActiveFrequency,
  setWeeklyActiveFrequency,
  weeklyActivityOther,
  setWeeklyActivityOther,
  allowLeaveOfAbsence: _allowLeaveOfAbsence,
  setAllowLeaveOfAbsence: _setAllowLeaveOfAbsence,
  content,
  setContent,
  contentImage,
  setContentImage,
  onContentImageUpload,
  contentFileUuid: _contentFileUuid,
  setContentFileUuid,
  recruitmentStatus: _recruitmentStatus,
  setRecruitmentStatus: _setRecruitmentStatus,
  recruitmentStartDate,
  setRecruitmentStartDate,
  recruitmentStartTime,
  setRecruitmentStartTime,
  recruitmentEndDate,
  setRecruitmentEndDate,
  recruitmentEndTime,
  setRecruitmentEndTime,
  recruitmentUrl,
  setRecruitmentUrl,
  externalLinks,
  setExternalLinks,
  isUploading,
  isSaving,
}: {
  club: ClubDetailRes;
  clubId: number;
  isEditingBasic: boolean;
  isEditingContent: boolean;
  isEditingRecruitment: boolean;
  onEditBasic: () => void;
  onEditContent: () => void;
  onEditRecruitment: () => void;
  onCancelBasic: () => void;
  onCancelContent: () => void;
  onCancelRecruitment: () => void;
  onSaveBasic: () => void;
  onSaveContent: () => void;
  onSaveRecruitment: () => void;
  name: string;
  setName: (value: string) => void;
  image: string;
  onImageUpload: (file: File) => void;
  summary: string;
  setSummary: (value: string) => void;
  category: ClubCategory;
  setCategory: (value: ClubCategory) => void;
  type: ClubType;
  setType: (value: ClubType) => void;
  targetGraduate: string;
  setTargetGraduate: (value: string) => void;
  leaderName: string;
  setLeaderName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  weeklyActiveFrequency: number | null;
  setWeeklyActiveFrequency: (value: number | null) => void;
  weeklyActivityOther: string;
  setWeeklyActivityOther: (value: string) => void;
  allowLeaveOfAbsence: boolean;
  setAllowLeaveOfAbsence: (value: boolean) => void;
  content: string;
  setContent: (value: string) => void;
  contentImage: string;
  setContentImage: (value: string) => void;
  onContentImageUpload: (file: File) => void;
  contentFileUuid: string | null;
  setContentFileUuid: (value: string | null) => void;
  recruitmentStatus: RecruitmentStatus;
  setRecruitmentStatus: (value: RecruitmentStatus) => void;
  recruitmentStartDate: string;
  setRecruitmentStartDate: (value: string) => void;
  recruitmentStartTime: string;
  setRecruitmentStartTime: (value: string) => void;
  recruitmentEndDate: string;
  setRecruitmentEndDate: (value: string) => void;
  recruitmentEndTime: string;
  setRecruitmentEndTime: (value: string) => void;
  recruitmentUrl: string;
  setRecruitmentUrl: (value: string) => void;
  externalLinks: { name: string; url: string }[];
  setExternalLinks: React.Dispatch<React.SetStateAction<{ name: string; url: string }[]>>;
  isUploading: boolean;
  isSaving: boolean;
}) {
  const getFaviconUrl = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
    } catch {
      return '';
    }
  };
  const getLinkDisplayName = (item: { name: string; url: string }) => {
    if (item.name.trim()) return item.name.trim();
    try {
      return new URL(item.url).hostname.replace(/^www\./, '');
    } catch {
      return item.url;
    }
  };

  const infoItems = [
    { label: '동아리 이름', value: club.name || '-' },
    { label: '한 줄 소개', value: club.summary || club.description || '-' },
    { label: '카테고리', value: CATEGORY_LABEL[club.category] },
    { label: '동아리 유형', value: TYPE_LABEL[club.type] },
    { label: '대상', value: club.targetGraduate || '-' },
    { label: '동아리장', value: club.leaderName || '-' },
    { label: '활동 장소', value: club.location || '-' },
    {
      label: '주간활동 횟수',
      value:
        club.weeklyActivity ??
        (club.weeklyActiveFrequency != null ? `${club.weeklyActiveFrequency}회` : '-'),
    },
    { label: '휴학생 지원 가능', value: club.allowLeaveOfAbsence ? '가능' : '불가능' },
  ];

  const valueBoxClass =
    'min-h-[48px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100';

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleContentImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onContentImageUpload(file);
    }
    e.target.value = '';
  };

  const cardClass =
    'club-manage-card rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800';

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden p-4">
      {/* 기본 정보 */}
      <div className={cardClass}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">기본 정보</h3>
          {!isEditingBasic ? (
            <button
              type="button"
              onClick={onEditBasic}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              aria-label="수정"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onPress={onCancelBasic}>
                취소
              </Button>
              <Button size="sm" variant="primary" onPress={onSaveBasic} isDisabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
        {!isEditingBasic ? (
          <div className="space-y-4">
            {infoItems.map((item) => (
              <div key={item.label}>
                <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </label>
                <div className={valueBoxClass}>{item.value}</div>
              </div>
            ))}
            {externalLinks.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  외부 링크
                </label>
                <ul className="space-y-2">
                  {externalLinks.map((item, i) => (
                    <li key={`${item.url}-${i}`}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg py-1.5 pr-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                      >
                        {getFaviconUrl(item.url) ? (
                          <Image
                            src={getFaviconUrl(item.url)}
                            alt=""
                            width={20}
                            height={20}
                            className="h-5 w-5 shrink-0 rounded object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="h-5 w-5 shrink-0 rounded bg-zinc-200 dark:bg-zinc-600" />
                        )}
                        <span className="min-w-0 truncate text-sm font-normal text-zinc-600 dark:text-zinc-400">
                          {getLinkDisplayName(item)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                프로필 사진
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept={IMAGE_ACCEPT_ATTR}
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="profile-image-upload"
                  disabled={isUploading}
                />
                <label htmlFor="profile-image-upload" className="cursor-pointer">
                  <div className="club-profile-upload-wrap relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-700">
                    {image ? (
                      <Image src={image} alt="프로필" fill className="object-cover" sizes="96px" />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-200 text-3xl font-light text-zinc-400 dark:bg-zinc-600 dark:text-zinc-500"
                        aria-hidden
                      >
                        +
                      </div>
                    )}
                  </div>
                </label>
                {isUploading && (
                  <div className="text-sm text-gray-500 dark:text-zinc-400">업로드 중...</div>
                )}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                동아리 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                한 줄 소개
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                카테고리
              </label>
              <Select
                value={category}
                onChange={(value) => value && setCategory(value as ClubCategory)}
              >
                <Select.Trigger className="club-manage-select-trigger rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="club-manage-dropdown">
                  <ListBox className="club-manage-dropdown-list">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <ListBox.Item
                        key={opt.value}
                        id={opt.value}
                        textValue={opt.label}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        {opt.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                동아리 타입
              </label>
              <Select value={type} onChange={(value) => value && setType(value as ClubType)}>
                <Select.Trigger className="club-manage-select-trigger rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="club-manage-dropdown">
                  <ListBox className="club-manage-dropdown-list">
                    {TYPE_OPTIONS.map((opt) => (
                      <ListBox.Item
                        key={opt.value}
                        id={opt.value}
                        textValue={opt.label}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        {opt.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                동아리장
              </label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                대상
              </label>
              <input
                type="text"
                value={targetGraduate}
                onChange={(e) => setTargetGraduate(e.target.value)}
                placeholder="예: 전학년, 컴퓨터공학부 재학생"
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                활동 장소
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                주간활동 횟수
              </label>
              <div
                className="weekly-frequency-buttons flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="주간활동 횟수 (하나만 선택)"
              >
                {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => {
                  const isSelected = weeklyActiveFrequency === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setWeeklyActiveFrequency(n);
                        setWeeklyActivityOther('');
                      }}
                      className={`h-11 min-w-11 rounded-xl border px-3 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-900'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  role="radio"
                  aria-checked={weeklyActiveFrequency === null}
                  onClick={() => setWeeklyActiveFrequency(null)}
                  className={`h-11 min-w-11 rounded-xl border px-3 text-sm font-medium transition-colors ${
                    weeklyActiveFrequency === null
                      ? 'border-blue-500 bg-blue-500 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  기타
                </button>
              </div>
              {weeklyActiveFrequency === null && (
                <input
                  type="text"
                  value={weeklyActivityOther}
                  onChange={(e) => setWeeklyActivityOther(e.target.value)}
                  placeholder="예: 월 1회, 격주 등"
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              )}
            </div>
            <div className="mt-8 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                휴학생 지원 가능 여부
              </label>
              <input
                type="checkbox"
                checked={_allowLeaveOfAbsence}
                onChange={(e) => _setAllowLeaveOfAbsence(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-zinc-300 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                외부 링크
              </label>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                이름과 링크를 입력하세요. (예: 인스타그램, https://instagram.com/...)
              </p>
              <div className="space-y-3">
                {externalLinks.map((item, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="이름"
                      value={item.name}
                      onChange={(e) => {
                        const next = [...externalLinks];
                        next[index] = { ...next[index], name: e.target.value };
                        setExternalLinks(next);
                      }}
                      className="w-28 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={item.url}
                      onChange={(e) => {
                        const next = [...externalLinks];
                        next[index] = { ...next[index], url: e.target.value };
                        setExternalLinks(next);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setExternalLinks((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="삭제"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExternalLinks((prev) => [...prev, { name: '', url: '' }])}
                  className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
                >
                  + 링크 추가
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 동아리 소개 */}
      <div className={cardClass}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">동아리 소개</h3>
          {!isEditingContent ? (
            <button
              type="button"
              onClick={onEditContent}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              aria-label="수정"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onPress={onCancelContent}>
                취소
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={onSaveContent}
                isDisabled={isSaving || isUploading}
              >
                {isSaving ? '저장 중...' : isUploading ? '이미지 업로드 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
        {!isEditingContent ? (
          <>
            {/* 동아리 소개: 사진 크게 → 아래 상세 설명 */}
            {contentImage && (
              <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={contentImage}
                  alt="동아리 소개"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            )}
            <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
              상세 설명
            </label>
            <div className="min-h-[120px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100">
              {club.content || '내용이 없습니다.'}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {/* 소개 사진 1장 (프로필과 동일 업로드) */}
            <div>
              <input
                type="file"
                accept={IMAGE_ACCEPT_ATTR}
                onChange={handleContentImageFileChange}
                className="hidden"
                id="content-image-upload"
                disabled={isUploading}
              />
              {contentImage ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={contentImage}
                    alt="동아리 소개"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setContentImage('');
                      setContentFileUuid(null);
                    }}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
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
              ) : (
                <label htmlFor="content-image-upload">
                  <div className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:border-zinc-500">
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
                          className="h-10 w-10 text-gray-400 dark:text-zinc-500"
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
                        <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          소개 사진 추가 (1장)
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                상세 설명
              </label>
              <textarea
                placeholder="동아리 상세 설명을 작성해주세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* 모집 정보 */}
      <div className={`${cardClass} w-full max-w-full min-w-0 overflow-hidden`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">모집 정보</h3>
          {!isEditingRecruitment ? (
            <button
              type="button"
              onClick={onEditRecruitment}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              aria-label="수정"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onPress={onCancelRecruitment}>
                취소
              </Button>
              <Button size="sm" variant="primary" onPress={onSaveRecruitment} isDisabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
        {!isEditingRecruitment ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                모집 상태
              </label>
              <div className={valueBoxClass}>
                <Chip
                  size="sm"
                  color={STATUS_CONFIG[club.recruitmentStatus as RecruitmentStatus].color}
                  variant="soft"
                  className="font-medium"
                >
                  {STATUS_CONFIG[club.recruitmentStatus as RecruitmentStatus].label}
                </Chip>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                모집 기간
              </label>
              <div className={`${valueBoxClass} min-w-0 truncate`}>
                {formatDateTimeReadMode(club.recruitmentStartDate)} ~{' '}
                {formatDateTimeReadMode(club.recruitmentEndDate)}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                지원 링크
              </label>
              <div className={valueBoxClass}>
                {club.applicationLink || club.recruitmentUrl ? (
                  <a
                    href={club.applicationLink || club.recruitmentUrl || ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block min-w-0 truncate text-sm text-blue-600 underline decoration-blue-300 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-600 dark:hover:decoration-blue-400"
                  >
                    {club.applicationLink || club.recruitmentUrl}
                  </a>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">없음</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-full min-w-0 space-y-5 overflow-hidden">
            <div className="w-full max-w-full min-w-0 space-y-4 overflow-hidden">
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(8rem,1fr)]">
                <div className="min-w-0 sm:min-w-[10rem]">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    모집 시작일
                  </label>
                  <input
                    type="date"
                    max={recruitmentEndDate || undefined}
                    value={recruitmentStartDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRecruitmentStartDate(v);
                      if (recruitmentEndDate && v > recruitmentEndDate) setRecruitmentEndDate(v);
                    }}
                    className="club-manage-date-input w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    style={{ minWidth: '8rem' }}
                  />
                </div>
                <div className="min-w-0 sm:min-w-[8rem]">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    모집 시작 시간
                  </label>
                  <select
                    value={recruitmentStartTime}
                    onChange={(e) => setRecruitmentStartTime(e.target.value)}
                    className="club-manage-time-input w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    style={{ minWidth: '6.5rem' }}
                  >
                    {HOUR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.slice(0, 2)}시
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(8rem,1fr)]">
                <div className="min-w-0 sm:min-w-[10rem]">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    모집 종료일
                  </label>
                  <input
                    type="date"
                    min={recruitmentStartDate || undefined}
                    value={recruitmentEndDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (recruitmentStartDate && v < recruitmentStartDate) return;
                      setRecruitmentEndDate(v);
                    }}
                    className="club-manage-date-input w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    style={{ minWidth: '8rem' }}
                  />
                </div>
                <div className="min-w-0 sm:min-w-[8rem]">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    모집 종료 시간
                  </label>
                  <select
                    value={recruitmentEndTime}
                    onChange={(e) => setRecruitmentEndTime(e.target.value)}
                    className="club-manage-time-input w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    style={{ minWidth: '6.5rem' }}
                  >
                    {HOUR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.slice(0, 2)}시
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                동아리 지원 외부 링크 (URL)
              </label>
              <input
                type="url"
                placeholder="https://example.com/apply"
                value={recruitmentUrl}
                onChange={(e) => setRecruitmentUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                지원 링크를 입력하면 동아리 상세 페이지에 &apos;동아리 지원&apos; 버튼이 표시됩니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 관리자: 항상 표시 */}
      <div className={cardClass}>
        <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">관리자</h3>
        <AdminManageSection clubId={clubId} onClose={() => {}} />
      </div>

    </div>
  );
}

function ClubFeedTab({ clubId }: { clubId: number }) {
  const router = useRouter();
  const { data, isLoading } = useClubFeeds(clubId);
  const feeds = data?.clubFeedList || [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2].map((i) => (
          <FeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {feeds.map((feed) => {
          const cover = feed.postUrls?.[0];
          return (
            <div
              key={feed.feedId}
              className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
            >
              <button
                type="button"
                onClick={() => router.push(`/clubs/${clubId}/feed?feedId=${feed.feedId}`)}
                className="absolute inset-0"
              >
                {cover ? (
                  <FeedCoverImage src={cover} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                    텍스트
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClubQnaTab({
  clubId,
  highlightQuestionId,
  onClearHighlightQuestionId,
}: {
  clubId: number;
  highlightQuestionId: string;
  onClearHighlightQuestionId: () => void;
}) {
  const { data: pendingQuestions, isLoading: pendingLoading } = usePendingQuestions(clubId, {
    page: 0,
    size: 50,
  });
  const { data: allQuestions, isLoading: allLoading } = useQuestions(clubId, { page: 0, size: 50 });
  const createAnswer = useCreateAnswer();
  const deleteQuestion = useDeleteQuestion(clubId);
  const [openMenuAllQuestionId, setOpenMenuAllQuestionId] = useState<number | null>(null);
  const [openMenuAllAnswerId, setOpenMenuAllAnswerId] = useState<number | null>(null);
  const [expandedAnswerQuestionId, setExpandedAnswerQuestionId] = useState<number | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<number, string>>({});
  const menuRefAll = useRef<HTMLDivElement>(null);
  const menuRefAllAnswer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenuAllQuestionId == null) return;
    const close = (e: MouseEvent) => {
      if (menuRefAll.current?.contains(e.target as Node)) return;
      setOpenMenuAllQuestionId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuAllQuestionId]);

  useEffect(() => {
    if (openMenuAllAnswerId == null) return;
    const close = (e: MouseEvent) => {
      if (menuRefAllAnswer.current?.contains(e.target as Node)) return;
      setOpenMenuAllAnswerId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuAllAnswerId]);

  // 질문으로 스크롤
  useEffect(() => {
    if (!highlightQuestionId) return;
    const id = parseInt(highlightQuestionId, 10);
    if (Number.isNaN(id)) return;
    const el = document.getElementById(`question-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onClearHighlightQuestionId();
    }
  }, [highlightQuestionId, onClearHighlightQuestionId]);

  const handleDeleteClick = (questionId: number) => {
    setOpenMenuAllQuestionId(null);
    if (window.confirm('정말 이 질문을 삭제하시겠습니까?')) {
      deleteQuestion.mutate(questionId);
    }
  };

  const handleAnswerSubmit = (questionId: number) => {
    const answer = answerTexts[questionId];
    if (!answer?.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }
    createAnswer.mutate(
      { questionId, data: { answer: answer.trim() } },
      {
        onSuccess: () => {
          setAnswerTexts((prev) => {
            const next = { ...prev };
            delete next[questionId];
            return next;
          });
          setExpandedAnswerQuestionId(null);
        },
      }
    );
  };

  if (pendingLoading || allLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <ListCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const pending = pendingQuestions?.content || [];
  const all = allQuestions?.content || [];

  return (
    <div className="space-y-4 p-4">
      {/* 전체 Q&A */}
      {all.length > 0 && (
        <>
          <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">전체 Q&A</h3>
          <div className="space-y-4">
            {all.map((qna) => (
              <div
                key={qna.id}
                id={`question-${qna.id}`}
                className="rounded-lg border border-[#e4e4e7] p-4 dark:border-zinc-600"
              >
                <div className="flex items-start gap-3">
                  <span className="relative shrink-0">
                    {!qna.answer && (
                      <span
                        className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500"
                        aria-hidden
                      />
                    )}
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                      aria-hidden
                    >
                      Q
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {qna.question}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatQnaDateTime(qna.createdAt)}
                    </p>
                  </div>
                  {!qna.answer && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() =>
                        setExpandedAnswerQuestionId((prev) =>
                          prev === qna.id ? null : qna.id
                        )
                      }
                      className="shrink-0 text-xs font-normal text-zinc-500 dark:text-zinc-400"
                    >
                      {expandedAnswerQuestionId === qna.id ? '접기' : '답변하기'}
                    </Button>
                  )}
                  <div
                    className="relative shrink-0"
                    ref={openMenuAllQuestionId === qna.id ? menuRefAll : undefined}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() =>
                        setOpenMenuAllQuestionId((prev) => (prev === qna.id ? null : qna.id))
                      }
                      isDisabled={deleteQuestion.isPending}
                      className="min-w-0 px-2"
                      aria-label="더보기"
                      aria-expanded={openMenuAllQuestionId === qna.id}
                    >
                      …
                    </Button>
                    {openMenuAllQuestionId === qna.id && (
                      <div
                        className="absolute top-full right-0 z-10 mt-1 min-w-[7rem] rounded-lg border bg-[var(--card)] py-1 shadow-lg"
                        style={{ borderColor: 'var(--border)' }}
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={() => {
                            setOpenMenuAllQuestionId(null);
                            handleDeleteClick(qna.id);
                          }}
                        >
                          삭제
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          onClick={() => {
                            setOpenMenuAllQuestionId(null);
                            alert('아직 준비중인 기능입니다.');
                          }}
                        >
                          신고
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {expandedAnswerQuestionId === qna.id && !qna.answer && (
                  <div className="mt-3 pt-3">
                    <div className="bg-default-100 relative flex min-h-0 w-full rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800/50">
                      <TextArea
                        placeholder="답변을 입력해주세요"
                        value={answerTexts[qna.id] || ''}
                        onChange={(e) =>
                          setAnswerTexts((prev) => ({ ...prev, [qna.id]: e.target.value }))
                        }
                        className="min-h-[2.5rem] w-full min-w-0 resize-none border-0 bg-transparent py-2 pr-14 pl-3 shadow-none placeholder:text-zinc-400 hover:shadow-none focus:ring-0 dark:placeholder:text-zinc-500"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        onPress={() => handleAnswerSubmit(qna.id)}
                        isDisabled={!answerTexts[qna.id]?.trim()}
                        isPending={createAnswer.isPending}
                        className="absolute top-1/2 right-1.5 shrink-0 -translate-y-1/2"
                      >
                        등록
                      </Button>
                    </div>
                  </div>
                )}
                {qna.answer && (
                  <div className="mt-3 flex items-start gap-3 pt-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                      aria-hidden
                    >
                      A
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {qna.answer}
                          </p>
                          {(qna.answeredBy || qna.answeredAt) && (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {[qna.answeredBy, qna.answeredAt && formatQnaDateTime(qna.answeredAt)]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                        <div
                          className="relative shrink-0"
                          ref={openMenuAllAnswerId === qna.id ? menuRefAllAnswer : undefined}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() =>
                              setOpenMenuAllAnswerId((prev) =>
                                prev === qna.id ? null : qna.id
                              )
                            }
                            isDisabled={deleteQuestion.isPending}
                            className="min-w-0 px-2"
                            aria-label="더보기"
                            aria-expanded={openMenuAllAnswerId === qna.id}
                          >
                            …
                          </Button>
                          {openMenuAllAnswerId === qna.id && (
                            <div
                              className="absolute top-full right-0 z-10 mt-1 min-w-[7rem] rounded-lg border bg-[var(--card)] py-1 shadow-lg"
                              style={{ borderColor: 'var(--border)' }}
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                onClick={() => {
                                  setOpenMenuAllAnswerId(null);
                                  handleDeleteClick(qna.id);
                                }}
                              >
                                삭제
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                onClick={() => {
                                  setOpenMenuAllAnswerId(null);
                                  alert('아직 준비중인 기능입니다.');
                                }}
                              >
                                신고
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {pending.length === 0 && all.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>아직 질문이 없습니다.</p>
        </div>
      )}

    </div>
  );
}

export default function ClubManagePage({ params }: PageProps) {
  const { id } = use(params);
  const clubId = parseInt(id, 10);

  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <ClubManageContent clubId={clubId} />
    </Suspense>
  );
}
