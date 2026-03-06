/**
 * 모바일 새로고침/튕김 원인 추적용 진단 로그.
 * 콘솔에서 [diagnostic] 또는 [loop] 로 필터링.
 */

const PREFIX = '[diagnostic]';
const LOOP_PREFIX = '[diagnostic][loop]';
const WINDOW_MS = 5000;
const LOOP_THRESHOLD = 4;

const effectRuns: Record<string, { count: number; firstAt: number }> = {};

export const diag = {
  log(category: string, message: string, data?: unknown) {
    if (typeof console?.log !== 'function') return;
    if (data !== undefined) {
      console.log(`${PREFIX} [${category}] ${message}`, data);
    } else {
      console.log(`${PREFIX} [${category}] ${message}`);
    }
  },

  /** useEffect 등 실행 횟수 기록. 짧은 시간에 여러 번 실행되면 무한루프 의심 로그 */
  recordEffectRun(name: string) {
    const now = Date.now();
    if (!effectRuns[name]) effectRuns[name] = { count: 0, firstAt: now };
    const r = effectRuns[name];
    if (now - r.firstAt > WINDOW_MS) {
      r.count = 0;
      r.firstAt = now;
    }
    r.count += 1;
    if (r.count >= LOOP_THRESHOLD) {
      console.warn(
        `${LOOP_PREFIX} 의존성 배열/상태 충돌 의심: "${name}" effect가 ${WINDOW_MS}ms 안에 ${r.count}회 실행됨`,
        { name, count: r.count, firstAt: r.firstAt }
      );
    }
  },

  /** 리다이렉트 발생 로그 (무한 리다이렉트 추적) */
  redirect(from: string, to: string, reason?: string) {
    this.log('redirect', `${from} → ${to}${reason ? ` (${reason})` : ''}`);
  },

  /** 401/인증 관련 */
  auth(message: string, data?: unknown) {
    this.log('auth', message, data);
  },

  /** 이미지/메모리 관련 */
  memory(message: string, data?: unknown) {
    this.log('memory', message, data);
  },

  /** 뷰포트/레이아웃 (vh 등) */
  viewport(message: string, data?: unknown) {
    this.log('viewport', message, data);
  },
};

/** 홈 페이지 이미지 로드 개수 (전역 카운터, 홈에서만 증가) */
let homeImageLoadCount = 0;
export function getAndIncrementHomeImageLoadCount(): number {
  homeImageLoadCount += 1;
  return homeImageLoadCount;
}
export function getHomeImageLoadCount(): number {
  return homeImageLoadCount;
}
export function resetHomeImageLoadCount(): void {
  homeImageLoadCount = 0;
}
