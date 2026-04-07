import Image from 'next/image';

const BANNER_SRC = '/banner/community-home.png';

/** 커뮤니티 홈 상단 광고 배너 (2:1 비율은 부모 `aspectRatio: 2/1`에서 유지) */
export function CommunityBannerCarousel() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
      <Image
        src={BANNER_SRC}
        alt="이곳, 배너를 통해 국민대 학생들에게 동아리 행사를 홍보해 보세요. 문의·접수는 국동이 인스타그램 DM"
        fill
        className="object-cover"
        sizes="(max-width: 448px) 100vw, 448px"
        priority
      />
    </div>
  );
}
