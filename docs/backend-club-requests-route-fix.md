# 동아리 생성 신청 API 경로 (관리자)

## 정리

백엔드에서 `/api/clubs` 는 ClubPresentation, `/api/clubs/requests` 는 ClubCreationPresentation 이라서  
Spring 이 둘 중 어디로 보낼지 구분하지 못해 `clubId` 변환 에러가 났고,  
**관리자 개설 승인은 `/api/admin/clubs/creation-requests` 로 분리**되었습니다.

## 클라이언트 호출 경로

| 기능             | 메서드 | URL                                                      |
| ---------------- | ------ | -------------------------------------------------------- |
| 내 신청 목록     | GET    | `/api/clubs/requests/my`                                 |
| 관리자 전체 목록 | GET    | `/api/admin/clubs/creation-requests`                     |
| 관리자 승인      | POST   | `/api/admin/clubs/creation-requests/{requestId}/approve` |
| 관리자 거절      | POST   | `/api/admin/clubs/creation-requests/{requestId}/reject`  |

- 동아리 생성 **신청** (사용자): `POST /api/clubs/requests` (변경 없음)
- 목록/승인/거절 중 **관리자용**만 `/api/admin/clubs/creation-requests` 사용
