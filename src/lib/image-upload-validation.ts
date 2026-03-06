/**
 * 이미지 업로드 공통 검증: 용량·파일 형식 제한.
 * 모바일 메모리 부족으로 인한 튕김 방지를 위해 모든 업로드 경로에서 사용.
 */

/** 허용 MIME 타입 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/** 허용 확장자 (파일명 검증용) */
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

/** 최대 파일 크기 (5MB). 모바일 메모리 고려 */
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** input[type=file] accept 속성 값 */
export const IMAGE_ACCEPT_ATTR =
  'image/jpeg,image/jpg,image/png,image/gif,image/webp';

/**
 * 단일 파일 용량·형식 검증. 실패 시 사용자 메시지가 담긴 Error를 throw.
 */
export function validateImageFile(file: File): void {
  const ext = (file.name.split('.').pop()?.toLowerCase() ?? '').replace(/[^a-z]/g, '');
  if (
    !ext ||
    !ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])
  ) {
    throw new Error(
      `지원하지 않는 파일 형식입니다. (허용: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')})`
    );
  }
  const mime = (file.type ?? '').toLowerCase();
  if (mime && !ALLOWED_IMAGE_MIME_TYPES.includes(mime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new Error(
      `지원하지 않는 파일 형식입니다. (허용: JPEG, PNG, GIF, WebP)`
    );
  }
  if (file.size <= 0) {
    throw new Error('파일 크기를 읽을 수 없습니다.');
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const maxMb = MAX_IMAGE_FILE_SIZE_BYTES / 1024 / 1024;
    const fileMb = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(`파일 크기는 ${maxMb}MB 이하여야 합니다. (현재: ${fileMb}MB)`);
  }
}
