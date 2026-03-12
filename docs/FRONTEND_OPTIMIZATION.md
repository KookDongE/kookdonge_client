# 프론트엔드 코드 최적화 보고서

## 1. 현재 코드 구조 문제점

### 1.1 컴포넌트 구조의 비효율성

- **경로 기반 UI 분기 중복**: `Header`와 `AppShell`에서 헤더 숨김/풀스크린/풀투리프레시/스크롤 비활성 경로를 각각 배열·정규식으로 중복 정의. 경로 추가·수정 시 두 파일을 동시에 수정해야 해 유지보수성과 일관성 위험.
- **대형 페이지 컴포넌트**: `app/home/page.tsx`(440줄 이상), `app/clubs/[id]/page.tsx`(1100줄 이상) 등 한 파일에 로직·UI·훅이 혼재해 가독성과 단위 테스트가 어렵다.

### 1.2 중복 코드 존재 여부

- **경로 판별 로직**: `isHeaderHidden`, `isFullScreenPath`, 풀투리프레시/스크롤 비활성 판별이 `app-shell.tsx`와 `header.tsx`에 중복.
- **shuffleArray**: 홈 동아리 목록 기본순 셔플용 Fisher-Yates 구현이 `home/page.tsx` 내부에만 존재. 재사용 가능한 배열 유틸이었으나 페이지에 묶여 있음.

### 1.3 불필요한 렌더링 발생 여부

- **FeedList**: 리스트 컨테이너이지만 `memo` 미적용. 부모(피드 페이지 등)가 리렌더될 때마다 FeedList도 리렌더되며, 자식인 `FeedItem`은 이미 `memo`로 최적화되어 있어 리스트 래퍼만 메모해도 이득이 있음.
- **FeedItem**: 이미 `memo` + `useCallback` 적용되어 있어 목록 아이템 단위 최적화는 양호.

### 1.4 상태 관리 구조의 문제

- 전역 인증: Zustand `useAuthStore` + persist로 토큰·유저 관리. 적절한 수준.
- 서버 상태: TanStack Query로 API 캐시·로딩/에러 일원화. feature별 `hooks.ts`에 쿼리/뮤테이션 분리되어 있어 구조는 명확.
- **props drilling**: 피드 페이지에서 `clubId`, `isManager`, `onEdit`, `onDelete` 등을 FeedList → FeedItem으로 내려보내는 정도로, 단계가 깊지 않아 현재는 큰 문제 없음. 다만 관리자/피드 관련 페이지가 더 복잡해지면 Context 또는 훅으로 올리는 것을 고려할 수 있음.

### 1.5 비효율적인 데이터 흐름

- API 호출은 `features/*/api.ts` + `lib/api/client.ts`로 분리되어 있음. 401 시 reissue 후 재시도, 토스트 처리 등이 client에 집중되어 있어 일관적.
- 커뮤니티 훅(`useBoardPosts`, `useMyPosts` 등)이 배열만 반환하는 형태로 되어 있어, 일부 페이지에서는 `isLoading`/`error`를 직접 쓰기 어렵고, 이미 구현된 곳은 query 결과를 한 번 더 가공하는 레이어가 있음.

### 1.6 불필요한 라이브러리 사용

- `@tanstack/react-query`, `zustand`, `nuqs`, `framer-motion`, `sonner`, `@heroui/react` 등 사용 목적이 분명하고 대체로 필요한 수준. 불필요한 중복 라이브러리는 없음.

### 1.7 코드 가독성 문제

- 경로 상수가 컴포넌트 파일 상단에 길게 나열되어 “어디를 수정해야 하나” 파악이 어렵고, 주석으로만 구분되어 있음.
- `app/clubs/[id]/page.tsx`처럼 한 파일이 매우 길어, 섹션별로 컴포넌트/훅 분리 시 가독성과 재사용성이 올라갈 여지가 있음.

### 1.8 재사용 불가능한 컴포넌트 설계

- `FeedItem`, `FeedList`, `ClubCard` 등은 props 기반으로 잘 분리되어 재사용 가능.
- 경로별 “헤더 숨김/풀스크린 여부” 등은 로직이 컴포넌트에 붙어 있어, 같은 규칙을 다른 곳(예: 미리보기, 임베드)에서 쓰려면 상수/훅으로 빼는 편이 좋음.

---

## 2. 개선 방향

- **경로 상수·판별 로직 일원화**: 헤더 숨김, 풀스크린, 풀투리프레시 비활성, 스크롤 비활성, 뒤로가기 표시 여부를 `src/lib/constants/routes.ts`로 모으고, `Header`·`AppShell`은 해당 함수만 사용하도록 변경.
- **공통 유틸 분리**: `shuffleArray`를 `src/lib/utils/array.ts`로 이동하고 `lib/utils/index.ts`에서 re-export. 홈 페이지는 여기서 import해 사용.
- **리스트 렌더 최적화**: `FeedList`를 `memo`로 감싸 부모 리렌더 시 불필요한 리스트 트리 리렌더 감소.
- **기능 유지**: 동작·스타일·타입은 기존과 동일하게 유지하고, 리팩터링 범위는 “경로 상수 통합 + 유틸 분리 + FeedList memo” 위주로 제한.

---

## 3. 수정된 폴더 구조

요청하신 구조와 현재 구조를 맞춘 권장 레이아웃입니다. **이번 작업에서 실제로 추가·수정한 경로만** 표시합니다.

```
src
├── app/                    # (기존 유지) 페이지·라우트
├── components/             # (기존 유지) 공통·도메인별 컴포넌트
├── features/               # (기존 유지) 도메인별 API·훅·스토어
├── hooks/                  # (비어 있음 → 공통 훅 추가 시 사용)
├── lib/
│   ├── api/                # (기존 유지) API 클라이언트
│   ├── constants/
│   │   └── routes.ts       # [신규] 경로 상수·판별 함수
│   ├── query/              # (기존 유지)
│   ├── theme/              # (기존 유지)
│   └── utils/
│       ├── array.ts        # [신규] shuffleArray 등
│       ├── cn.ts
│       ├── date.ts
│       ├── index.ts        # (수정) array re-export 추가
│       └── upload.ts
├── types/                  # (기존 유지)
├── constants/              # (기존 유지) club 등
├── styles/                 # (기존 유지)
└── ...
```

- **pages**: Next.js App Router 사용으로 `app/` 아래에만 페이지가 있으며, `pages` 디렉터리는 없음.
- **services**: API는 `features/*/api.ts` + `lib/api`에 두는 현재 구조를 유지. 필요 시 `services/`를 두고 `lib/api`를 감싸는 레이어로 확장 가능.
- **assets**: `public/` 및 스타일·아이콘 등 기존 위치 유지.

---

## 4. 리팩토링된 코드 예시

### 4.1 경로 상수·판별 일원화 — `src/lib/constants/routes.ts`

```typescript
/**
 * 앱 전역에서 사용하는 경로 관련 상수.
 * Header 숨김, 풀스크린, 풀투리프레시/스크롤 비활성 등 일원화하여 중복 제거.
 */

export const FULL_SCREEN_PATHS = ['/', '/login'] as const;

export const HEADER_HIDDEN_PATHS = [
  '/',
  '/login',
  '/welcome',
  '/mypage/clubs/apply',
  '/community/write',
  '/mypage/settings/bug-report',
  '/mypage/settings/report',
  '/mypage/settings/name',
] as const;

export const PULL_TO_REFRESH_DISABLED_PATHS = [/* 정규식 배열 */] as const;
export const SCROLL_DISABLED_PATHS = [/* 정규식 배열 */] as const;

export function isFullScreenPath(pathname: string): boolean { ... }
export function isHeaderHidden(pathname: string): boolean { ... }
export function isPullToRefreshDisabled(pathname: string): boolean { ... }
export function isScrollDisabled(pathname: string): boolean { ... }
export function shouldShowBackButton(pathname: string): boolean { ... }
```

### 4.2 AppShell — 경로 로직을 routes에서만 사용

```typescript
import {
  isFullScreenPath,
  isHeaderHidden,
  isPullToRefreshDisabled,
  isScrollDisabled,
} from '@/lib/constants/routes';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? '';
  const fullScreen = isFullScreenPath(path);
  const headerHidden = isHeaderHidden(path);
  const pullToRefreshDisabled = isPullToRefreshDisabled(path);
  const scrollDisabled = isScrollDisabled(path);
  // ... 나머지 동일
}
```

### 4.3 Header — 숨김·뒤로가기만 routes 사용

```typescript
import { isHeaderHidden, shouldShowBackButton } from '@/lib/constants/routes';

export function Header() {
  const pathname = usePathname();
  const path = pathname ?? '';
  const showBackButton = shouldShowBackButton(path);
  if (isHeaderHidden(path)) return null;
  // ...
}
```

### 4.4 공통 유틸 — `src/lib/utils/array.ts` & re-export

```typescript
// lib/utils/array.ts
export function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// lib/utils/index.ts
export { shuffleArray } from './array';
export { cn } from './cn';
export { formatQnaDateTime, formatTimeAgo, parseApiIsoToDate } from './date';
```

홈 페이지에서는 `import { shuffleArray } from '@/lib/utils'` 로 사용하고, 페이지 내부의 로컬 `shuffleArray` 정의는 제거.

### 4.5 FeedList — memo 적용

```typescript
import { memo, useEffect } from 'react';

export const FeedList = memo(function FeedList({
  feeds,
  isLoading,
  clubId,
  isManager,
  showManagerMenu = true,
  scrollToFeedId,
  onEdit,
  onDelete,
  isDeleting,
}: FeedListProps) {
  // ... 기존 구현 동일
});
```

---

## 5. 성능 개선 포인트

### 5.1 적용한 항목

- **경로 로직 중복 제거**: 한 곳만 수정하면 Header/AppShell 동작이 같이 바뀌어 실수 감소 및 번들에서 중복 코드 제거에 도움.
- **FeedList memo**: 피드 페이지 등 부모가 리렌더될 때 FeedList 트리가 props가 바뀌지 않으면 리렌더되지 않음. FeedItem이 이미 memo라서, 리스트 래퍼까지 memo로 맞추면 불필요한 재렌더가 줄어듦.
- **shuffleArray 유틸화**: 홈 외 다른 화면에서도 동일 셔플이 필요하면 재사용 가능하고, 홈 페이지 코드 길이만 줄어듦.

### 5.2 추가로 권장하는 항목 (동작 변경 없이 적용 가능)

- **Lazy loading / Code splitting**: 관리자(`/admin/*`), 커뮤니티 글쓰기/수정, 마이페이지 설정 등 상대적으로 덜 자주 쓰는 라우트를 `next/dynamic`으로 로드해 초기 번들 크기 감소.
  - 예: `const AdminReports = dynamic(() => import('@/app/admin/reports/...'), { loading: () => <PageSkeleton /> });`
- **이미지·asset 최적화**: Next.js `Image` 사용처는 이미 있음. `sizes`/`priority`를 화면별로 점검하고, 가능한 경우 WebP/AVIF 등으로 정적 asset 정리.
- **번들 사이즈**: `npm run build` 후 `.next` 분석으로 무거운 의존성 확인. `framer-motion` 등은 트리쉐이킹이 잘 되도록 named import 유지.
- **불필요한 re-render**: `useBoardPosts` 등 배열만 반환하는 훅을 쓰는 컴포넌트에서, 상위에서 `isLoading`/`error`를 내려주고 하위는 memo로 받는 구조로 정리하면, 로딩/에러 시에도 리렌더 범위를 줄일 수 있음.

---

## 6. 추가 조건 충족 여부

- **기존 기능 변경 없음**: 경로별 헤더/풀스크린/풀투리프레시/스크롤 동작은 이전과 동일하게 유지.
- **코드 스타일 일관성**: 기존 Prettier/ESLint 및 타입 스타일을 유지했고, 새 파일도 동일 규칙 적용.
- **타입스크립트 타입 안정성**: `routes.ts`에서 `as const`와 명시적 반환 타입 사용, FeedList/FeedItem props 타입 변경 없음.

---

이 문서는 위와 같은 범위의 리팩터링을 반영한 결과를 정리한 것입니다. 추가로 페이지 단위 lazy loading, 대형 페이지의 컴포넌트/훅 분리 등을 진행하면 유지보수성과 성능을 더 끌어올릴 수 있습니다.
