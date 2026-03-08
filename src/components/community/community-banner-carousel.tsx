'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

const BANNER_IMAGES = ['/banner/1.png', '/banner/2.png', '/banner/3.png'];
const AUTO_PLAY_MS = 3000;
const SWIPE_THRESHOLD = 50;

export function CommunityBannerCarousel() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? BANNER_IMAGES.length - 1 : i - 1));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % BANNER_IMAGES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(goNext, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [goNext]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].clientX;
    const delta = touchStartX.current - endX;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD) goNext();
    else if (delta < -SWIPE_THRESHOLD) goPrev();
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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
