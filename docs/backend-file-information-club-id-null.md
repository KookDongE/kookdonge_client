# file_information club_id NOT NULL 에러 (백엔드)

## 증상

```
500: could not execute statement [Column 'club_id' cannot be null]
[insert into file_information (club_id, ...) values (?,...)]
```

## 원인

- **POST /api/files** (커뮤니티 이미지 업로드 완료 등록) 호출 시, 백엔드에서 `file_information`에 insert할 때 `club_id`를 넣지 않아 null이 들어가고, DB의 `club_id` NOT NULL 제약에 걸립니다.
- 동아리 피드/동아리 소개 이미지는 **POST /api/clubs/{clubId}/files** 를 쓰므로 URL에서 `club_id`를 받을 수 있습니다.
- 커뮤니티 글쓰기는 **POST /api/files** 를 사용하며, 글 작성자가 **동아리(CLUB)** 일 때만 클라이언트가 body에 `clubId`를 넣도록 수정했습니다. **일반 사용자(USER)** / **비회원(ANONYMOUS)** 로 작성할 때는 `clubId`가 없습니다.

## 클라이언트에서 한 작업

- `FileUploadCompleteRequest`에 선택 필드 `clubId?: number` 추가.
- 커뮤니티 글쓰기에서 **동아리로 작성**할 때만 `clubId`를 포함해 `POST /api/files` 호출.

## 백엔드에서 할 작업

`POST /api/files` 처리 시 `file_information` insert 전에 `club_id`를 반드시 설정해야 합니다.

1. **요청 body에 `clubId`가 있으면**  
   해당 값을 `club_id`로 사용.

2. **`clubId`가 없을 때 (일반 사용자/비회원 커뮤니티 업로드)**  
   아래 중 하나로 처리해야 합니다.
   - **방법 A**: `file_information.club_id` 컬럼을 **nullable**로 변경하고, 미지정 시 `NULL` 저장.  
     (커뮤니티 전용 파일은 동아리 소속이 아니므로 의미상 맞음.)
   - **방법 B**: “전역/미지정”용 고정값(예: `0` 또는 별도 관리용 club id)을 정의하고, `clubId` 없을 때 그 값으로 insert.  
     이 경우 DB/도메인에서 해당 값의 의미를 문서화하는 것이 좋습니다.

수정 후 커뮤니티 글쓰기(이미지 첨부) 시 위 500 에러가 나지 않아야 합니다.
