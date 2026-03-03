'use client';

/**
 * 공통 스켈레톤 컴포넌트 (globals.css .skeleton 클래스 사용)
 * 페이지/섹션 로딩 시 Spinner 대신 레이아웃에 맞는 스켈레톤 표시
 */

/** 알림 카드 형태 (배지 + 시간 + 메시지 2줄) */
export function NotificationCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-4 w-12 rounded" />
        </div>
        <div className="skeleton mb-1 h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
      </div>
    </div>
  );
}

/** 리스트 카드 (아바타/이미지 + 제목 + 부제 + 칩) - 신청목록, 대기목록, 관리동아리 등 */
export function ListCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <div className="skeleton h-6 w-14 shrink-0 rounded-full" />
    </div>
  );
}

/** 프로필 섹션 (이름 + 이메일 영역) */
export function ProfileSkeleton() {
  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="skeleton h-6 w-28 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

/** 동아리 상세 헤더 (로고 + 태그들 + 제목 + 요약) */
export function ClubDetailHeaderSkeleton() {
  return (
    <div className="bg-white px-4 py-6 dark:bg-zinc-900">
      <div className="flex gap-4">
        <div className="skeleton h-28 w-28 shrink-0 rounded-2xl" />
        <div className="flex min-h-28 flex-1 flex-col">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <div className="skeleton h-5 w-12 rounded-md" />
            <div className="skeleton h-5 w-14 rounded-md" />
            <div className="skeleton h-5 w-16 rounded-md" />
          </div>
          <div className="skeleton mt-1 h-6 w-3/4 rounded" />
          <div className="skeleton mt-2 h-4 w-full rounded" />
          <div className="mt-auto flex justify-end gap-2 pt-2">
            <div className="skeleton h-9 w-9 rounded-lg" />
            <div className="skeleton h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 피드 아이템 1개 (이미지 + 내용) */
export function FeedItemSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <div className="skeleton aspect-video w-full rounded-lg" />
      <div className="space-y-1 px-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

/** 제목 + 폼 필드 블록 (설정/이름변경 등) */
export function FormPageSkeleton() {
  return (
    <div className="space-y-6 px-4 py-6">
      <div className="skeleton h-6 w-24 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-10 w-full rounded-lg" />
      </div>
      <div className="skeleton h-10 w-full rounded-lg" />
    </div>
  );
}

/** 테이블/리스트 페이지 (헤더 + 행 여러 개) */
export function TablePageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 px-4 py-6">
      <div className="skeleton h-7 w-32 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="skeleton h-4 flex-1 rounded" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** 단순 전체 로딩 (콜백/인증 등 짧은 로딩용 - 스켈레톤 블록 몇 개) */
export function PageCenteredSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
      <div className="skeleton h-12 w-12 rounded-full" />
      <div className="skeleton h-5 w-32 rounded" />
      <div className="skeleton h-4 w-48 rounded" />
    </div>
  );
}

/** 탭 + 컨텐츠 영역 스켈레톤 */
export function TabContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 px-4">
        <div className="skeleton h-9 w-20 rounded-full" />
        <div className="skeleton h-9 w-20 rounded-full" />
      </div>
      <div className="space-y-3 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
