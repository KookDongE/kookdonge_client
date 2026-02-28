'use client';

import Image from 'next/image';

import { useTheme } from 'next-themes';

import { DEFAULT_CLUB_IMAGE_DARK, DEFAULT_CLUB_IMAGE_LIGHT } from '@/constants/club';

type DefaultClubImageProps = {
  className?: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
};

/**
 * 동아리 로고가 없을 때 표시하는 기본 이미지.
 * 라이트/다크 모드에 따라 적절한 기본 사진을 표시합니다.
 */
export function DefaultClubImage({
  className,
  fill = true,
  sizes = '112px',
  width,
  height,
}: DefaultClubImageProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === 'dark' ? DEFAULT_CLUB_IMAGE_DARK : DEFAULT_CLUB_IMAGE_LIGHT;
  // resolvedTheme은 SSR/초기에는 undefined일 수 있음 → 라이트 기본값 사용

  if (fill) {
    return <Image src={src} alt="" fill className={className} sizes={sizes} />;
  }
  return (
    <Image
      src={src}
      alt=""
      width={width ?? 112}
      height={height ?? 112}
      className={className}
      sizes={sizes}
    />
  );
}
