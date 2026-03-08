'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const BANNER_IMAGES = ['/banner/1.png', '/banner/2.png', '/banner/3.png'];
const AUTO_PLAY_MS = 3000;

export function CommunityBannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BANNER_IMAGES.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {BANNER_IMAGES.map((src, i) => (
          <div
            key={src}
            className="relative h-full min-w-full shrink-0"
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {/* 인디케이터: 오른쪽 아래, 가로로 긴 둥근 직사각형 점 */}
      <div
        className="absolute bottom-3 right-3 flex items-center gap-1.5"
        aria-hidden
      >
        {BANNER_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${
              i === index
                ? 'w-5 bg-white/95 dark:bg-white/90'
                : 'w-1.5 bg-white/50 dark:bg-white/40'
            }`}
            aria-label={`배너 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
