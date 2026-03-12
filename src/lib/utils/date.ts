/**
 * API에서 내려오는 ISO 문자열은 UTC인데 'Z' 없이 오면 JS가 로컬 시간으로 파싱해 -9시간 어긋남.
 * 타임존 접미사가 없으면 UTC로 간주해 파싱한 Date 반환.
 */
export function parseApiIsoToDate(iso: string | null | undefined): Date | null {
  if (!iso || iso.trim() === '') return null;
  let toParse = iso.trim();
  if (!/Z|[+-]\d{2}:?\d{2}$/.test(toParse)) {
    toParse = toParse + 'Z';
  }
  const d = new Date(toParse);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Q&A 등에서 사용할 날짜+시간 표기. 예: "26.03.04 23:12"
 * - 접미사 있음(Z 등): UTC로 파싱 후 UTC 기준 표시(서버 시각 그대로)
 * - 접미사 없음: KST(+09:00)로 파싱 후 KST 표시
 */
export function formatQnaDateTime(iso: string | null | undefined): string {
  if (!iso || iso.trim() === '') return '-';
  let toParse = iso.trim();
  const hasOffset = /Z|[+-]\d{2}:?\d{2}$/.test(toParse);
  if (!hasOffset) {
    toParse = toParse + '+09:00';
  }
  const d = new Date(toParse);
  if (Number.isNaN(d.getTime())) return '-';
  const timeZone = hasOffset ? 'UTC' : 'Asia/Seoul';
  const now = new Date();
  const isCurrentYear =
    (timeZone === 'UTC' ? d.getUTCFullYear() : d.getFullYear()) ===
    (timeZone === 'UTC' ? now.getUTCFullYear() : now.getFullYear());
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: isCurrentYear ? undefined : '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const datePart = isCurrentYear
    ? `${get('month')}.${get('day')}`
    : `${get('year')}.${get('month')}.${get('day')}`;
  return `${datePart} ${get('hour')}:${get('minute')}`;
}

/** 상대 시간 표시 (피드·댓글 등). 예: "방금 전", "3분 전", "2일 전" */
export function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString?.trim()) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
