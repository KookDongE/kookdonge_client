'use client';

import { useState } from 'react';
import Image from 'next/image';

/** 이미지 없음/로드 실패 시 회색 배경만 표시 (피드 썸네일용) */
export function FeedCoverImage({ src, sizes = '120px' }: { src: string; sizes?: string }) {
  const [error, setError] = useState(false);
  if (!src?.trim() || error) {
    return <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700" />;
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      sizes={sizes}
      onError={() => setError(true)}
    />
  );
}
