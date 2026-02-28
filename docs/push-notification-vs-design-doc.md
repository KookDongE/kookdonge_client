# 푸시 알림 설계 문서 vs Kookdonge 구현 비교

문서: "FCM을 활용한 푸시 알림 시스템을 처음부터 구현하는 과정"  
비교 대상: Kookdonge **프론트엔드** + **OpenAPI 스펙**(백엔드 구현은 미확인).

---

## 1. 도메인 차이 (문서 vs Kookdonge)

| 구분          | 문서 (예시)                                           | Kookdonge                                                          |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| **트리거**    | "질문 공개 시간(publishAt) 도달" → 스케줄러 매분 체크 | 이벤트 기반: 동아리 승인/거절, Q&A 답변, 모집 시작/마감 등         |
| **발송 시점** | 스케줄러가 `notificationSentAt IS NULL` 조회 후 발송  | 각 기능에서 이벤트 발생 시 발송 (스케줄러 유무는 백엔드 구현 의존) |
| **엔티티**    | Question (publishAt, notificationSentAt)              | Club, Application, Q&A, WaitingList 등                             |

→ **설계 의도(토큰 수집, Data Message, 비동기/중복 방지, 무효 토큰 정리)는 동일하게 적용 가능.** 도메인만 다름.

---

## 2. 문서 기준 체크리스트 vs 현재 구현

### 2.1 디바이스 토큰 수집 (1단계)

| 문서 항목                                    | Kookdonge 구현                                               | 비고        |
| -------------------------------------------- | ------------------------------------------------------------ | ----------- |
| 로그인/앱 설치 시 클라이언트가 FCM 토큰 발급 | ✅ `getFcmToken()` (권한 허용 시에만 유효 토큰)              |             |
| 서버에 토큰 등록 `POST /devices`             | ✅ `POST /api/devices` (DeviceRegisterReq)                   | 경로만 다름 |
| DB에 user_id + device_id + fcm_token 저장    | ⚪ OpenAPI 스펙상 요청 필드 일치. 실제 DB는 백엔드 확인 필요 |             |
| 기기별 식별자(deviceId) 클라이언트 생성      | ✅ `getOrCreateDeviceId()` (localStorage, UUID)              |             |
| platform (WEB/ANDROID/IOS)                   | ✅ `platform: 'WEB'` 전송                                    |             |

**문서 추가 제안**

- **Upsert**: "같은 기기 재등록 시 토큰만 갱신" → 스펙 설명에 있음. 백엔드 구현 확인 필요.
- **FCM 토큰 검증(dryRun)**: 문서는 "등록 전에 dryRun으로 유효성 검증" 권장. **현재 프론트는 검증 없이 등록**하며, `web-pending`/`web-denied`로 미발급·거부 상태를 서버에 전달. 백엔드에서 dryRun 검증 여부는 백엔드 확인 필요.

---

### 2.2 디바이스 API (문서 4.4~4.6)

| API             | 문서                                               | Kookdonge                                             | 비고                                 |
| --------------- | -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| 등록            | `POST /api/v1/notifications/devices`               | `POST /api/devices`                                   | ✅ 스펙 있음                         |
| 삭제 (로그아웃) | `DELETE .../devices/{deviceId}`                    | `DELETE /api/devices/{deviceId}`                      | ✅ 로그아웃 시 `deleteDevice()` 호출 |
| 알림 설정 조회  | `GET .../devices/{deviceId}/notification-settings` | `GET /api/devices/{deviceId}/notification-settings`   | ✅ 마이페이지 알림 설정에서 사용     |
| 알림 설정 변경  | `PATCH .../notification-settings`                  | `PATCH /api/devices/{deviceId}/notification-settings` | ✅                                   |

**문서와의 차이**

- 문서: Device에 `isPwaInstalled` 등 추가 필드 가능.  
  Kookdonge OpenAPI: 등록 요청은 `deviceId`, `fcmToken`, `platform`만 정의.  
  → 현재 클라이언트는 문서의 최소 필드만 전송하고 있어서 설계와 충돌 없음.

---

### 2.3 FCM 메시지 형식 (문서 4.10)

| 문서                                                        | Kookdonge                                                                    | 비고                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| **Data Message** 사용 (Notification 아님)                   | ✅ 서비스 워커가 `payload.data`만 사용                                       | `firebase-messaging-sw.js`                        |
| `data.title`, `data.body`(또는 message), `data.redirectUrl` | ✅ SW에서 `title`, `body`/`message`, `redirectUrl` 읽어서 `showNotification` | 문서와 동일 포맷 권장됨 (백엔드 협업 문서에 명시) |

→ **문서의 "Data Message + data 필드 구조"와 맞춰져 있음.**

---

### 2.4 클라이언트 발송 전 흐름 (문서 2~4단계)

문서의 "질문 생성 → 스케줄러 → 발송"은 **백엔드/도메인** 영역.  
Kookdonge은 동아리/모집/Q&A **이벤트 발생 시** 발송하는 구조로 가정되며, 스케줄러는 “모집 예정 → 모집 시작” 같은 시간 기반만 쓰일 수 있음.  
→ **프론트에서는 검증 불가.** 백엔드에서 다음만 확인하면 됨.

- 발송 트리거: 이벤트 시점 vs 스케줄러
- 중복 발송 방지(예: 발송 시작 마킹 후 커밋, afterCommit)
- 비동기 발송·500개 배치·무효 토큰 정리

---

### 2.5 무효 토큰·권한 거부 처리 (클라이언트)

| 문서                                                  | Kookdonge                                    | 비고                                |
| ----------------------------------------------------- | -------------------------------------------- | ----------------------------------- |
| FCM 응답 UNREGISTERED/INVALID → 서버에서 토큰 삭제    | ⚪ 백엔드 구현 확인 필요                     | 프론트 없음                         |
| 권한 거부 시에도 기기 등록은 하고, “발송 제외”만 하기 | ✅ `fcmToken: token ?? 'web-denied'` 로 등록 | 문서의 “발송 스킵 유도”와 동일 의도 |

---

### 2.6 알림 히스토리·읽음 처리

문서에는 “알림 히스토리 API”가 예시로만 나오고,  
Kookdonge은 OpenAPI에 다음이 정의되어 있고 **프론트에서 사용 중**.

- `GET /api/notifications` (목록, page/size)
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`

→ 문서의 “사용자가 지난 알림을 볼 수 있도록” 요구사항은 **스펙·클라이언트 기준으로 충족**.

---

## 3. 문서 “핵심 설계 포인트 3가지” 대응

| 설계 포인트                | 문서 내용                                  | Kookdonge (판단 가능한 범위)           |
| -------------------------- | ------------------------------------------ | -------------------------------------- |
| **1. 중복 발송 방지**      | DB에 발송 시작 먼저 마킹·커밋 후 발송      | ⚪ 백엔드 구현 확인 필요 (프론트 무관) |
| **2. 비동기 처리**         | 스케줄러는 마킹만, 실제 발송은 별도 스레드 | ⚪ 백엔드 구현 확인 필요               |
| **3. 무효 토큰 자동 정리** | FCM UNREGISTERED 등 시 해당 토큰 삭제      | ⚪ 백엔드 구현 확인 필요               |

→ **클라이언트는 “토큰 등록·삭제·설정”과 “Data Message 수신·표시”만 담당하므로, 위 3가지는 백엔드 검증 항목.**

---

## 4. 문서 “체크리스트” 중 프론트/스펙으로 확인 가능한 항목

### Firebase 설정 (클라이언트 관점)

- [x] Firebase 프로젝트·웹 앱 설정 (env + `firebase-messaging-sw.js`에 config 반영)
- [x] VAPID 키 사용 (getToken 시)
- [x] 서비스 워커 등록 후 getToken (백그라운드 수신 가능)
- [x] Data Message 수신 시 `title` / `body`(또는 message) / `redirectUrl` 사용

### 디바이스·API 계약

- [x] 로그인 후 디바이스 등록 호출 (AuthProvider → requestPermissionAndRegister / registerDeviceWithBackend)
- [x] deviceId, fcmToken, platform 전송
- [x] 로그아웃 시 디바이스 삭제 (deleteDevice)
- [x] 알림 설정 조회/변경 API 호출 (마이페이지 알림 설정)

### 보안·정책 (클라이언트 관점)

- [x] 디바이스 API는 인증 필요 (apiClient가 Bearer 토큰 사용)
- [x] 권한 거부 시 `web-denied`로 등록해 발송 제외 유도

### 문서에 있으나 이 레포에서 확인 불가 (백엔드)

- [ ] Device 테이블 (user_id, device_id) 유니크
- [ ] FCM 토큰 검증(dryRun) 후 저장 여부
- [ ] 발송: 비동기, 500개 배치, afterCommit 중복 방지
- [ ] 무효 토큰 배치 삭제

---

## 5. 요약

- **문서의 “설계 의도와 흐름”**
  - 디바이스 토큰 수집 → 서버 저장 → Data Message로 발송 → 알림 히스토리/읽음  
    → **Kookdonge 프론트와 OpenAPI 스펙은 이 흐름과 잘 맞게 구현·정의되어 있음.**

- **문서와의 차이**
  - 도메인: “질문 공개 스케줄”이 아니라 “동아리/모집/Q&A 이벤트” 기반 알림.
  - API 경로: `/api/devices` 등 (문서 예시와 prefix만 다름).
  - 서버 측: 토큰 dryRun 검증, 스케줄러/비동기/배치/무효 토큰 정리, 중복 발송 방지는 **백엔드 구현 확인** 필요.

- **다른 서비스에 문서 적용 시**
  - 클라이언트: “디바이스 등록·삭제·알림 설정 + Data Message 수신”은 현재 Kookdonge 구조를 참고하면 됨.
  - 서버: 문서의 “핵심 설계 3가지 + 체크리스트”를 그대로 적용하면 됨.
