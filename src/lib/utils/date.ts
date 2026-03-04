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
 * Q&A 등에서 사용할 날짜+시간 표기 (한국 시간). 예: "26.03.04 23:12"
 */
export function formatQnaDateTime(iso: string | null | undefined): string {
  const d = parseApiIsoToDate(iso);
  if (!d) return '-';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
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
