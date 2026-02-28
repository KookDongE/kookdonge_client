'use client';

type DefaultClubImageProps = {
  className?: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
};

/**
 * 동아리 로고가 없을 때 표시하는 기본 placeholder.
 * 이미지 없이 라이트/다크 모드에 따라 배경색만 다르게 표시합니다.
 */
export function DefaultClubImage({
  className = '',
  fill = true,
  width,
  height,
}: DefaultClubImageProps) {
  const baseClass =
    'bg-zinc-200 text-zinc-400 dark:bg-zinc-600 dark:text-zinc-500 flex items-center justify-center';

  if (fill) {
    return <div className={`absolute inset-0 ${baseClass} ${className}`} aria-hidden />;
  }
  return (
    <div
      className={`${baseClass} ${className}`}
      style={{ width: width ?? 112, height: height ?? 112 }}
      aria-hidden
    />
  );
}
