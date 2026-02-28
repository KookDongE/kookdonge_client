# 3단계: 백엔드와 손발 맞추기 (협업 체크리스트)

프론트엔드 알림 로직이 준비되었습니다. 아래 사항을 백엔드 담당자에게 확인 요청하세요.

---

## 1. 디바이스 API: POST /api/devices

**확인 요청:** 프론트가 보낸 `deviceId`와 `fcmToken`을 저장할 준비가 되었는지 확인해 주세요.

| 항목                      | 내용                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **엔드포인트**            | `POST /api/devices`                                                                |
| **호출 시점**             | 앱 설치/로그인 시 (프론트: 로그인 성공 후 자동 호출)                               |
| **요청 스키마 (OpenAPI)** | `RequestDTODeviceRegisterReq` → `data`: `DeviceRegisterReq`                        |
| **필수 필드**             | `deviceId` (string), `fcmToken` (string), `platform` ("WEB" \| "ANDROID" \| "IOS") |
| **동작**                  | 기존 디바이스면 토큰만 갱신, 새 디바이스면 신규 등록                               |

**프론트 전송 예시 (본 프로젝트):**

```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "fcmToken": "Firebase에서 발급받은 FCM 토큰 또는 'web-pending'",
  "platform": "WEB"
}
```

※ OpenAPI에 `timestamp`/`data` 래핑이 있다면, 실제 서버가 그 형식을 기대하는지도 확인 필요합니다.

---

## 2. 데이터 메시지 형식 (FCM 발송 방식)

**확인 요청:** 알림을 보낼 때 **Notification 메시지**가 아닌 **Data Message** 형식으로 보내는지 확인해 주세요.

| 항목     | 내용                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| **형식** | **Data Message** (payload에 `notification`이 아닌 `data`만 사용)                            |
| **이유** | 앱이 백그라운드/종료 상태에서도 서비스 워커가 `payload.data`를 받아 알림을 직접 띄우기 위함 |

**서버에서 FCM 발송 시 `data` 필드에 포함할 키:**

| 키                    | 설명                                                      | 필수                                 |
| --------------------- | --------------------------------------------------------- | ------------------------------------ |
| `title`               | 알림 제목                                                 | 권장 (없으면 프론트에서 "알림" 사용) |
| `body` 또는 `message` | 알림 본문                                                 | 권장                                 |
| `redirectUrl`         | 알림 클릭 시 이동 경로 (예: `/notifications`, `/clubs/1`) | 권장 (없으면 `/notifications`)       |

**프론트 서비스 워커 (`public/firebase-messaging-sw.js`) 동작:**

- `payload.data.title`, `payload.data.body`(또는 `message`), `payload.data.redirectUrl`을 읽어 `showNotification`으로 표시합니다.
- `notification` 필드를 사용해도 동작은 하겠지만, Data Message만 사용하는 것을 전제로 구현되어 있습니다.

---

## 3. 알림 히스토리 API: GET /api/notifications 등

**확인 요청:** 사용자가 앱 내에서 지난 알림을 보고, 읽음 처리할 수 있도록 아래 API가 **문서(OpenAPI)대로** 구현되었는지 체크해 주세요.

| API               | 메서드                                           | 설명                        | 프론트 사용처  |
| ----------------- | ------------------------------------------------ | --------------------------- | -------------- |
| 알림 목록 조회    | `GET /api/notifications`                         | 내 알림 목록 (페이지네이션) | 알림 목록 화면 |
| 안 읽은 알림 개수 | `GET /api/notifications/unread-count`            | 안 읽은 알림 개수           | 헤더 배지      |
| 알림 읽음 처리    | `PATCH /api/notifications/{notificationId}/read` | 특정 알림 읽음 처리         | 알림 상세/목록 |
| 전체 읽음 처리    | `PATCH /api/notifications/read-all`              | 전체 읽음 처리              | 알림 목록      |

**알림 목록 응답 (OpenAPI: `ResponseDTONotificationListRes` → `NotificationListRes`):**

- `notifications`: `NotificationRes[]`
- `hasNext`: boolean
- `page`, `size`: number

**알림 한 건 (`NotificationRes`):**

- `id`, `type`, `title`, `message`, `redirectUrl`, `clubId`, `isRead`, `createdAt`

**쿼리 파라미터 (GET /api/notifications):**

- `page` (기본 0), `size` (기본 20)

---

## 요약

| #   | 확인 항목     | 확인 요청 문구                                                                                               |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | 디바이스 API  | `POST /api/devices`로 `deviceId`, `fcmToken`, `platform`을 저장/갱신할 수 있는지                             |
| 2   | FCM 발송 형식 | 알림 발송 시 **Data Message**로 `title`, `body`(또는 `message`), `redirectUrl`을 `data`에 담아 보내는지      |
| 3   | 알림 API      | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH` 읽음 처리 API가 스펙대로 동작하는지 |

위 항목이 모두 준비되면 프론트와 연동 후 로그인 → 디바이스 등록 → 푸시 수신 → 알림 목록/읽음 처리까지 흐름을 검증할 수 있습니다.
