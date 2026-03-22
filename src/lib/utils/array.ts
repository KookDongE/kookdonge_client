/**
 * Fisher-Yates 셔플. 불변 배열을 반환 (원본 변경 없음).
 * 홈 동아리 목록 기본순 무작위 표시 등에 사용.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
