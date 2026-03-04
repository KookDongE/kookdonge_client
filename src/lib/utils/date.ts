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
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}`;
}
