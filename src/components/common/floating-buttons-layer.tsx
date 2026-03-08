'use client';

import { usePathname, useParams, useSearchParams } from 'next/navigation';

import { ClubCTAFloatingButton } from '@/components/club/club-cta-floating-button';
import { CommunityWriteFloatingButton } from '@/components/community/community-write-floating-button';
import { FeedAddFloatingButton } from '@/components/mypage/feed-add-floating-button';

/** 커뮤니티 목록 경로: 글쓰기 버튼 노출 (글쓰기·글상세 페이지에서는 숨김) */
const COMMUNITY_WRITE_PATHS = [
  '/community',
  '/community/popular',
  '/community/promo',
  '/community/free',
];
function isCommunityWritePath(pathname: string): boolean {
  if (!pathname) return false;
  // 글쓰기 페이지에서는 플로팅 버튼 숨김
  if (pathname === '/community/write' || pathname.startsWith('/community/write/')) return false;
  // 글상세 페이지(/community/posts/[id])에서는 플로팅 버튼 숨김
  if (/^\/community\/posts\/[^/]+/.test(pathname)) return false;
  if (pathname === '/community' || pathname === '/community/') return true;
  return COMMUNITY_WRITE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** 동아리 상세 (정보/피드/qna 탭): 지원하기 버튼 노출. /clubs/[id] 만, /clubs/[id]/feed 등 제외 */
function isClubDetailPath(pathname: string): boolean {
  return /^\/clubs\/[^/]+\/?$/.test(pathname ?? '');
}

/** 동아리 관리 피드 탭: 피드 추가 버튼 노출 */
function isManageFeedPath(pathname: string): boolean {
  return /^\/mypage\/clubs\/[^/]+\/manage\/?$/.test(pathname ?? '');
}

/**
 * 풀리프레시/스크롤 영역(motion.div) 바깥에서 플로팅 버튼을 렌더해 transform 영향을 받지 않도록 함.
 * AppShell에서 PullToRefresh와 형제로 렌더.
 */
export function FloatingButtonsLayer() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const p = pathname ?? '';

  const tab = searchParams.get('tab') ?? 'info';
  const clubIdFromParams = params?.id;
  const clubId = typeof clubIdFromParams === 'string' ? parseInt(clubIdFromParams, 10) : NaN;
  const validClubId = Number.isInteger(clubId) && clubId >= 1;

  return (
    <>
      {isCommunityWritePath(p) && <CommunityWriteFloatingButton />}
      {isClubDetailPath(p) && validClubId && (
        <ClubCTAFloatingButton clubId={clubId} currentTab={tab} />
      )}
      {isManageFeedPath(p) && tab === 'feed' && validClubId && (
        <FeedAddFloatingButton clubId={clubId} />
      )}
    </>
  );
}
