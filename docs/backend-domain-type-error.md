# 동아리 소개 사진 저장 시 domain_type 에러 해결 (백엔드)

## 증상

동아리 소개 사진 저장 시 아래 SQL 실행 중 에러 발생:

```
Data truncated for column 'domain_type' at row 1
[update file_information set club_id=?, domain_type=?, ... where file_id=?]
```

## 원인

- 클라이언트는 **domain_type을 전송하지 않습니다.**  
  PUT `/api/clubs/{clubId}/content` body: `{ content, contentFileUuid }`  
  POST `/api/clubs/{clubId}/files` body: `{ uuid, fileName, fileSize, extension }`
- `domain_type`은 **백엔드에서** 파일을 동아리와 연결할 때(예: content 저장 시 `contentFileUuid` 반영) 설정됩니다.
- `file_information.domain_type` 컬럼에 들어가는 값이 **컬럼 정의와 맞지 않을 때** 위 에러가 납니다.
  - 컬럼이 `ENUM(...)` 이면: 등록된 enum 값이 아닌 문자열을 넣고 있음.
  - 컬럼이 `VARCHAR(n)` 이면: 넣는 문자열 길이가 `n`을 초과함.

## 백엔드에서 할 작업

1. **DB 컬럼 확인**  
   `file_information.domain_type` 의 정의 확인 (타입, 길이, ENUM 목록).

2. **저장 시 사용하는 값 확인**  
   동아리 소개 이미지용으로 어떤 문자열을 넣고 있는지 확인 (예: `CLUB_DESCRIPTION`, `CLUB_CONTENT` 등).

3. **둘 중 하나로 수정**
   - **방법 A**: `domain_type`에 넣는 값을 **컬럼에 맞게** 수정  
     - ENUM이면: enum에 정의된 값만 사용 (필요 시 enum에 값 추가).  
     - VARCHAR(n)이면: 길이 n 이하의 값 사용 (예: `CLUB_DESC`, `DESC` 등 짧은 코드).
   - **방법 B**: 컬럼 정의를 **실제 사용 값에 맞게** 수정  
     - VARCHAR 길이를 늘리거나, ENUM에 필요한 값을 추가.

수정 후 동아리 소개 사진 저장을 다시 시도하면 해당 에러는 사라져야 합니다.
