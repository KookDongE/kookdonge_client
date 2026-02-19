'use client';

import { Suspense, use, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Button,
  Chip,
  Input,
  ListBox,
  Select,
  Spinner,
  Switch,
  Tabs,
  TextArea,
} from '@heroui/react';
import { parseAsString, useQueryState } from 'nuqs';

import { ClubCategory, RecruitmentStatus, ClubType } from '@/types/api';
import {
  useClubDetail,
  useUpdateClubDetail,
  useClubAdmins,
  useAddClubAdmin,
  useRemoveClubAdmin,
} from '@/features/club/hooks';
import { usePendingQuestions, useCreateAnswer, useDeleteQuestion } from '@/features/question/hooks';
import { useQuestions } from '@/features/question/hooks';
import { useClubFeeds, useDeleteFeed, useGetPresignedUrls } from '@/features/feed/hooks';
import { uploadFile, uploadFiles } from '@/lib/utils/upload';

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
};

const STATUS_CONFIG: Record<
  RecruitmentStatus,
  { label: string; color: 'success' | 'accent' | 'default' }
> = {
  RECRUITING: { label: '모집중', color: 'success' },
  SCHEDULED: { label: '모집예정', color: 'accent' },
  CLOSED: { label: '모집마감', color: 'default' },
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
  value: value as ClubCategory,
  label,
}));

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({
  value: value as ClubType,
  label,
}));

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

function ClubManageContent({ clubId }: { clubId: number }) {
  const router = useRouter();
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('info'));
  const [highlightQuestionId, setHighlightQuestionId] = useQueryState(
    'questionId',
    parseAsString.withDefault('')
  );
  const { data: club, isLoading } = useClubDetail(clubId);
  const updateClub = useUpdateClubDetail();

  // 편집 모드 상태
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingRecruitment, setIsEditingRecruitment] = useState(false);
  const [adminSectionExpanded, setAdminSectionExpanded] = useState(false);

  // 파일 업로드 관련
  const getPresignedUrls = useGetPresignedUrls(clubId);

  // 폼 상태
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<ClubCategory>('ACADEMIC');
  const [type, setType] = useState<ClubType>('CENTRAL');
  const [targetGraduate, setTargetGraduate] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [location, setLocation] = useState('');
  const [weeklyActiveFrequency, setWeeklyActiveFrequency] = useState(1);
  const [allowLeaveOfAbsence, setAllowLeaveOfAbsence] = useState(false);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionImages, setDescriptionImages] = useState<string[]>([]);
  const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>('RECRUITING');
  const [recruitmentStartDate, setRecruitmentStartDate] = useState('');
  const [recruitmentEndDate, setRecruitmentEndDate] = useState('');
  const [recruitmentUrl, setRecruitmentUrl] = useState('');

  // Q&A 답변 상태
  const [answerTexts, setAnswerTexts] = useState<Record<number, string>>({});

  // 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (club && !isLoading) {
      setName(club.name || '');
      setImage(club.image || '');
      setSummary(club.summary || '');
      setCategory(club.category);
      setType(club.type);
      setTargetGraduate(club.targetGraduate || '');
      setLeaderName(club.leaderName || '');
      setLocation(club.location || '');
      setWeeklyActiveFrequency(club.weeklyActiveFrequency || 1);
      setAllowLeaveOfAbsence(club.allowLeaveOfAbsence || false);
      setContent(club.content || '');
      setDescription(club.description || '');
      setDescriptionImages(club.descriptionImages || []);
      setRecruitmentStatus(club.recruitmentStatus);
      setRecruitmentStartDate(club.recruitmentStartDate.split('T')[0]);
      setRecruitmentEndDate(club.recruitmentEndDate.split('T')[0]);
      setRecruitmentUrl(club.recruitmentUrl || '');
    }
  }, [club, isLoading]);

  if (isLoading || !club) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const handleSaveBasic = async () => {
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
          weeklyActiveFrequency,
          allowLeaveOfAbsence,
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
      const url = await uploadFile(file, (data) => getPresignedUrls.mutateAsync(data));
      setImage(url);
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleSaveContent = async () => {
    updateClub.mutate(
      {
        clubId,
        data: { content, description, descriptionImages },
      },
      {
        onSuccess: () => {
          setIsEditingContent(false);
          alert('상세 정보가 저장되었습니다.');
        },
      }
    );
  };

  const handleDescriptionImagesUpload = async (files: File[]) => {
    try {
      const urls = await uploadFiles(files, (data) => getPresignedUrls.mutateAsync(data));
      setDescriptionImages([...descriptionImages, ...urls]);
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleSaveRecruitment = () => {
    updateClub.mutate(
      {
        clubId,
        data: {
          recruitmentStatus,
          recruitmentStartDate: recruitmentStartDate ? `${recruitmentStartDate}T00:00:00` : undefined,
          recruitmentEndDate: recruitmentEndDate ? `${recruitmentEndDate}T23:59:59` : undefined,
          recruitmentUrl: recruitmentUrl || undefined,
        },
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
      {/* 뒤로가기 */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span className="inline-block h-4 w-4">←</span>
          <span>뒤로가기</span>
        </button>
      </div>

      {/* 헤더 */}
      <div className="bg-white px-4 py-6 dark:bg-zinc-900">
        <div className="flex gap-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm dark:bg-zinc-800">
            {club.image ? (
              <Image src={club.image} alt={club.name} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-400 dark:text-zinc-500">
                🏠
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex items-center gap-2">
              <Chip size="sm" color={status.color} variant="soft">
                {status.label}
              </Chip>
            </div>
            <h1 className="mt-1.5 text-xl font-bold text-zinc-900 dark:text-zinc-100">{club.name}</h1>
            {club.summary && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{club.summary}</p>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {TYPE_LABEL[club.type]} · {CATEGORY_LABEL[club.category]}
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-xl bg-red-50 py-3 text-center dark:bg-red-950/30">
            <div className="text-xl font-bold text-red-500 dark:text-red-400">
              {club.totalLikeCount}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">좋아요</div>
          </div>
          <div className="flex-1 rounded-xl bg-blue-50 py-3 text-center dark:bg-blue-950/30">
            <div className="text-xl font-bold text-blue-500 dark:text-blue-400">
              {club.totalViewCount}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">조회수</div>
          </div>
        </div>
      </div>

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as string)} className="w-full">
        <Tabs.ListContainer className="bg-white px-4 dark:bg-zinc-900">
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

        {/* 정보 탭 */}
        <Tabs.Panel id="info">
          <ClubInfoTab
            club={club}
            clubId={clubId}
            // 편집 상태
            isEditingBasic={isEditingBasic}
            isEditingContent={isEditingContent}
            isEditingRecruitment={isEditingRecruitment}
            // 편집 모드 토글
            onEditBasic={() => setIsEditingBasic(true)}
            onEditContent={() => setIsEditingContent(true)}
            onEditRecruitment={() => setIsEditingRecruitment(true)}
            onCancelBasic={() => setIsEditingBasic(false)}
            onCancelContent={() => setIsEditingContent(false)}
            onCancelRecruitment={() => setIsEditingRecruitment(false)}
            // 저장 핸들러
            onSaveBasic={handleSaveBasic}
            onSaveContent={handleSaveContent}
            onSaveRecruitment={handleSaveRecruitment}
            // 폼 상태
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
            allowLeaveOfAbsence={allowLeaveOfAbsence}
            setAllowLeaveOfAbsence={setAllowLeaveOfAbsence}
            content={content}
            setContent={setContent}
            description={description}
            setDescription={setDescription}
            descriptionImages={descriptionImages}
            setDescriptionImages={setDescriptionImages}
            onDescriptionImagesUpload={handleDescriptionImagesUpload}
            recruitmentStatus={recruitmentStatus}
            setRecruitmentStatus={setRecruitmentStatus}
            recruitmentStartDate={recruitmentStartDate}
            setRecruitmentStartDate={setRecruitmentStartDate}
            recruitmentEndDate={recruitmentEndDate}
            setRecruitmentEndDate={setRecruitmentEndDate}
            recruitmentUrl={recruitmentUrl}
            setRecruitmentUrl={setRecruitmentUrl}
            // 관리자 관리
            adminSectionExpanded={adminSectionExpanded}
            onManageAdmins={() => setAdminSectionExpanded(true)}
            onCloseAdmins={() => setAdminSectionExpanded(false)}
            // 업로드 상태
            isUploading={getPresignedUrls.isPending}
            // 업데이트 상태
            isSaving={updateClub.isPending}
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
            answerTexts={answerTexts}
            setAnswerTexts={setAnswerTexts}
            highlightQuestionId={highlightQuestionId}
            onClearHighlightQuestionId={() => setHighlightQuestionId('')}
          />
        </Tabs.Panel>
      </Tabs>

      {/* 하단 네비 공간 확보 */}
      <div className="h-32" />
    </>
  );
}

function AdminManageSection({ clubId, onClose }: { clubId: number; onClose: () => void }) {
  const { data: admins, isLoading } = useClubAdmins(clubId);
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
    if (confirm(`정말 ${email} 관리자 권한을 제거하시겠습니까?`)) {
      removeAdmin.mutate({ clubId, email });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="light" onPress={onClose}>
          닫기
        </Button>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          관리자 추가
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="admin@kookmin.ac.kr"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1 rounded-xl border-0 bg-gray-50 p-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
          <Button color="primary" onPress={handleAddAdmin} isPending={addAdmin.isPending}>
            추가
          </Button>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          현재 관리자 목록
        </label>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : !admins || admins.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            관리자가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {admins.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="text-sm text-zinc-900 dark:text-zinc-100">{email}</span>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleRemoveAdmin(email)}
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
  allowLeaveOfAbsence,
  setAllowLeaveOfAbsence,
  content,
  setContent,
  description,
  setDescription,
  descriptionImages,
  setDescriptionImages,
  onDescriptionImagesUpload,
  recruitmentStatus,
  setRecruitmentStatus,
  recruitmentStartDate,
  setRecruitmentStartDate,
  recruitmentEndDate,
  setRecruitmentEndDate,
  recruitmentUrl,
  setRecruitmentUrl,
  // 관리자 관리
  adminSectionExpanded,
  onManageAdmins,
  onCloseAdmins,
  // 업로드/저장 상태
  isUploading,
  isSaving,
}: {
  club: any;
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
  weeklyActiveFrequency: number;
  setWeeklyActiveFrequency: (value: number) => void;
  allowLeaveOfAbsence: boolean;
  setAllowLeaveOfAbsence: (value: boolean) => void;
  content: string;
  setContent: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  descriptionImages: string[];
  setDescriptionImages: (value: string[]) => void;
  onDescriptionImagesUpload: (files: File[]) => void;
  recruitmentStatus: RecruitmentStatus;
  setRecruitmentStatus: (value: RecruitmentStatus) => void;
  recruitmentStartDate: string;
  setRecruitmentStartDate: (value: string) => void;
  recruitmentEndDate: string;
  setRecruitmentEndDate: (value: string) => void;
  recruitmentUrl: string;
  setRecruitmentUrl: (value: string) => void;
  adminSectionExpanded: boolean;
  onManageAdmins: () => void;
  onCloseAdmins: () => void;
  isUploading: boolean;
  isSaving: boolean;
}) {
  const infoItems = [
    {
      label: '모집 기간',
      value: `${formatDate(club.recruitmentStartDate)} ~ ${formatDate(club.recruitmentEndDate)}`,
    },
    { label: '대상', value: club.targetGraduate },
    { label: '동아리장', value: club.leaderName },
    { label: '활동 장소', value: club.location },
    { label: '주간 활동', value: `${club.weeklyActiveFrequency}회` },
    { label: '휴학생 가입', value: club.allowLeaveOfAbsence ? '가능' : '불가능' },
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDescriptionImagesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDescriptionImagesUpload(files);
    }
  };

  const cardClass =
    'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800';

  return (
    <div className="space-y-4 p-4">
      {/* 기본 정보 - 상단 */}
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="light" onPress={onCancelBasic}>
                  취소
                </Button>
                <Button size="sm" color="primary" onPress={onSaveBasic} isDisabled={isSaving}>
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
              </div>
            )}
          </div>
          {!isEditingBasic ? (
            <div className="space-y-3">
              {infoItems.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">{item.label}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.value}</span>
                </div>
              ))}
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
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="profile-image-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="profile-image-upload" className="cursor-pointer">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-700">
                      {image ? (
                        <Image src={image} alt="프로필" fill className="object-cover" sizes="96px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">🏠</div>
                      )}
                      <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="h-4 w-4"
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
                      </div>
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
                  <Select.Trigger className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
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
                  <Select.Trigger className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {TYPE_OPTIONS.map((opt) => (
                        <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
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
                  주간 활동 횟수
                </label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={weeklyActiveFrequency.toString()}
                  onChange={(e) => setWeeklyActiveFrequency(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    휴학생 가입 허용
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    휴학생도 동아리에 가입할 수 있도록 허용합니다
                  </p>
                </div>
                <Switch isSelected={allowLeaveOfAbsence} onValueChange={setAllowLeaveOfAbsence} />
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="light" onPress={onCancelContent}>
                  취소
                </Button>
                <Button size="sm" color="primary" onPress={onSaveContent} isDisabled={isSaving}>
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
              </div>
            )}
          </div>
        {!isEditingContent ? (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
              {club.content || '내용이 없습니다.'}
            </p>
            {descriptionImages && descriptionImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {descriptionImages.map((url: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-5">
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
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                설명 이미지
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleDescriptionImagesFileChange}
                className="hidden"
                id="description-images-upload"
                disabled={isUploading}
              />
              {descriptionImages.length === 0 ? (
                <label htmlFor="description-images-upload">
                  <div className="flex h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:border-zinc-500">
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
                          className="h-8 w-8 text-gray-400 dark:text-zinc-500"
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
                        <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">이미지 추가</span>
                      </div>
                    )}
                  </div>
                </label>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {descriptionImages.map((url, index) => (
                    <div key={index} className="relative aspect-square w-24 overflow-hidden rounded-xl">
                      <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                      <button
                        type="button"
                        onClick={() => setDescriptionImages(descriptionImages.filter((_, i) => i !== index))}
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
                  <label htmlFor="description-images-upload">
                    <div className="flex aspect-square w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:border-zinc-500">
                      {isUploading ? (
                        <Spinner size="sm" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="h-6 w-6 text-gray-400 dark:text-zinc-500"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* 모집 정보 */}
      <div className={cardClass}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">모집 정보</h3>
          {!isEditingRecruitment ? (
            <button
              type="button"
              onClick={onEditRecruitment}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              aria-label="수정"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="light" onPress={onCancelRecruitment}>
                취소
              </Button>
              <Button size="sm" color="primary" onPress={onSaveRecruitment} isDisabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
        {!isEditingRecruitment ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">모집 상태</span>
              <Chip size="sm" color={STATUS_CONFIG[club.recruitmentStatus].color} variant="soft">
                {STATUS_CONFIG[club.recruitmentStatus].label}
              </Chip>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">모집 기간</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatDate(club.recruitmentStartDate)} ~ {formatDate(club.recruitmentEndDate)}
              </span>
            </div>
            {club.recruitmentUrl && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">지원 링크</span>
                <a
                  href={club.recruitmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-500 hover:underline dark:text-blue-400"
                >
                  링크 열기
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                모집 상태
              </label>
              <Select
                value={recruitmentStatus}
                onChange={(value) => value && setRecruitmentStatus(value as RecruitmentStatus)}
              >
                <Select.Trigger className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <ListBox.Item key={value} id={value} textValue={config.label}>
                        {config.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                모집 시작일
              </label>
              <input
                type="date"
                value={recruitmentStartDate}
                onChange={(e) => setRecruitmentStartDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                모집 종료일
              </label>
              <input
                type="date"
                value={recruitmentEndDate}
                onChange={(e) => setRecruitmentEndDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
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
                지원 링크를 입력하면 동아리 상세 페이지에 '동아리 지원' 버튼이 표시됩니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 관리자 관리 */}
      <div className={cardClass}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">관리자</h3>
          {!adminSectionExpanded ? (
            <button
              type="button"
              onClick={onManageAdmins}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              aria-label="수정"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="light" onPress={onCloseAdmins}>
                취소
              </Button>
              <Button size="sm" color="primary" onPress={onCloseAdmins}>
                저장
              </Button>
            </div>
          )}
        </div>
        {!adminSectionExpanded ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            동아리를 함께 관리할 관리자를 추가하거나 제거할 수 있습니다.
          </p>
        ) : (
          <AdminManageSection clubId={clubId} onClose={onCloseAdmins} />
        )}
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
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1.5">
      {/* 피드 추가 버튼 */}
      <button
        type="button"
        onClick={() => router.push(`/mypage/clubs/${clubId}/manage/feed/new`)}
        className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-8 w-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-medium">피드 추가</span>
        </div>
      </button>

      {/* 피드 목록 */}
      {feeds.map((feed) => {
        const cover = feed.postUrls[0];
        return (
          <button
            key={feed.feedId}
            type="button"
            onClick={() => router.push(`/clubs/${clubId}/feed`)}
            className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800"
          >
            {cover ? (
              <Image src={cover} alt="" fill className="object-cover" sizes="120px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                텍스트
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ClubQnaTab({
  clubId,
  answerTexts,
  setAnswerTexts,
  highlightQuestionId,
  onClearHighlightQuestionId,
}: {
  clubId: number;
  answerTexts: Record<number, string>;
  setAnswerTexts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
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
  const [deleteModalQuestionId, setDeleteModalQuestionId] = useState<number | null>(null);
  const [expandedPendingQuestionId, setExpandedPendingQuestionId] = useState<number | null>(null);

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
    setDeleteModalQuestionId(questionId);
  };

  const handleDeleteConfirm = () => {
    if (deleteModalQuestionId != null) {
      deleteQuestion.mutate(deleteModalQuestionId, {
        onSettled: () => setDeleteModalQuestionId(null),
      });
    }
  };

  const handleAnswerSubmit = (questionId: number) => {
    const answer = answerTexts[questionId];
    if (!answer?.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    createAnswer.mutate(
      {
        questionId,
        data: { answer: answer.trim() },
      },
      {
        onSuccess: () => {
          setAnswerTexts((prev) => {
            const next = { ...prev };
            delete next[questionId];
            return next;
          });
        },
      }
    );
  };

  if (pendingLoading || allLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const pending = pendingQuestions?.content || [];
  const all = allQuestions?.content || [];

  return (
    <div className="space-y-4 p-4">
      {/* 대기 중인 질문 */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
            답변 대기 중인 질문 ({pending.length})
          </h3>
          <div className="space-y-4">
            {pending.map((qna) => {
              const isExpanded = expandedPendingQuestionId === qna.id;
              return (
                <div
                  key={qna.id}
                  id={`question-${qna.id}`}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPendingQuestionId((prev) => (prev === qna.id ? null : qna.id))
                      }
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <Chip size="sm" color="accent" variant="primary" className="shrink-0">
                        Q
                      </Chip>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {qna.question}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(qna.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                        {isExpanded ? '접기' : '답변하기'}
                      </span>
                    </button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => handleDeleteClick(qna.id)}
                      isPending={deleteQuestion.isPending}
                    >
                      삭제
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                      <TextArea
                        placeholder="답변을 입력해주세요"
                        value={answerTexts[qna.id] || ''}
                        onChange={(e) =>
                          setAnswerTexts((prev) => ({ ...prev, [qna.id]: e.target.value }))
                        }
                        className="w-full resize-none"
                        minRows={3}
                      />
                      <Button
                        size="sm"
                        color="primary"
                        onPress={() => handleAnswerSubmit(qna.id)}
                        isPending={createAnswer.isPending}
                        className="w-full"
                      >
                        답변 등록
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 전체 Q&A */}
      {all.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">전체 Q&A</h3>
          <div className="space-y-4">
            {all.map((qna) => (
              <div
                key={qna.id}
                id={`question-${qna.id}`}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex items-start gap-3">
                  <Chip size="sm" color="accent" variant="primary" className="shrink-0">
                    Q
                  </Chip>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {qna.question}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(qna.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => handleDeleteClick(qna.id)}
                    isPending={deleteQuestion.isPending}
                  >
                    삭제
                  </Button>
                </div>
                {qna.answer && (
                  <div className="mt-3 flex items-start gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                    <Chip size="sm" color="success" variant="primary" className="shrink-0">
                      A
                    </Chip>
                    <p className="flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {qna.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && all.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-12 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
          <p>아직 질문이 없습니다.</p>
        </div>
      )}

      {/* 질문 삭제 확인 모달 */}
      {deleteModalQuestionId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteModalQuestionId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-zinc-900 dark:text-zinc-100">
              정말 이 질문을 삭제하시겠습니까?
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="light"
                className="flex-1"
                onPress={() => setDeleteModalQuestionId(null)}
              >
                취소
              </Button>
              <Button
                color="danger"
                className="flex-1"
                onPress={handleDeleteConfirm}
                isPending={deleteQuestion.isPending}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClubManagePage({ params }: PageProps) {
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
      <ClubManageContent clubId={clubId} />
    </Suspense>
  );
}
