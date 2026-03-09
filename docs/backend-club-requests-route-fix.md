# 백엔드: /api/clubs/requests 라우트 매칭 오류 수정 가이드

## 증상

- **URL**: https://www.kookdonge.co.kr/admin/applications
- **에러 메시지**: `Method parameter 'clubId': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; For input string: "requests"`

## 원인

클라이언트는 **관리자용 동아리 생성 신청 목록** 조회를 위해 다음 API를 호출합니다.

- **메서드**: `GET`
- **경로**: `/api/clubs/requests` (쿼리: `page`, `size`, `status` 등)

백엔드에서 이 요청이 **`/api/clubs/{clubId}`** 패턴에 먼저 매칭되어, 경로 세그먼트 `"requests"`가 `clubId` 파라미터로 바인딩되고, 이를 `Long`으로 변환하다가 실패한 상황입니다.

즉, **구체 경로(`/api/clubs/requests`)보다 경로 변수 경로(`/api/clubs/{clubId}`)가 우선 매칭**되고 있습니다.

## 해결 방법 (Spring 기준)

1. **구체 경로를 경로 변수보다 먼저 매칭되도록 하기**
   - `GET /api/clubs/requests` 를 처리하는 핸들러를 **`GET /api/clubs/{clubId}` 를 처리하는 핸들러보다 먼저** 등록되도록 합니다.
   - 같은 컨트롤러라면, **리터럴 경로 매핑을 위에, `{clubId}` 매핑을 아래에** 두면 됩니다.

2. **컨트롤러 분리**
   - 동아리 생성 신청(Club Creation Request) 전용 컨트롤러를 두고, `@RequestMapping("/api/clubs/requests")` 로 선언하면 `/api/clubs/requests` 가 명시적으로 먼저 매칭되도록 할 수 있습니다.

3. **매핑 순서 확인**
   - Spring MVC는 등록 순서에 따라 매칭될 수 있으므로, 다음이 보장되도록 합니다.
     - `GET /api/clubs/requests` → 전체 신청 목록 (관리자)
     - `GET /api/clubs/requests/my` → 내 신청 목록
     - `POST /api/clubs/requests` → 동아리 생성 신청
     - `POST /api/clubs/requests/{requestId}/approve` 등
     - 그 다음에 `GET /api/clubs/{clubId}` (동아리 상세 등)

## OpenAPI 스펙 기준 경로

- `GET /api/clubs/requests` — 전체 신청 목록 조회 (관리자), operationId: `getAllRequests`
- `GET /api/clubs/{clubId}` — 동아리 상세 조회, operationId: `getClubDetail`

위 두 경로가 공존할 때, **`/api/clubs/requests` 가 `/api/clubs/{clubId}` 보다 우선 매칭**되면 문제가 해결됩니다.

## 클라이언트

클라이언트는 이미 `GET /api/clubs/requests` 를 올바르게 호출하고 있으며, 수정이 필요 없습니다.
