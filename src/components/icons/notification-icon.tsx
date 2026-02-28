'use client';

/** 헤더/공용 벨 아이콘 (알림) - currentColor 상속 */
export function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/** 알림 끔 (벨 + 사선) - currentColor 상속 */
export function NotificationOffIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M187.501 97.1V90.05C187.501 51.36 157.261 20 120.001 20C82.7406 20 52.5006 51.36 52.5006 90.05V97.1C52.5127 105.516 50.1111 113.758 45.5806 120.85L34.5006 138.1C24.3906 153.85 32.1106 175.26 49.7006 180.24C95.6635 193.257 144.338 193.257 190.301 180.24C207.891 175.26 215.611 153.85 205.501 138.11L194.421 120.86C189.887 113.769 187.482 105.527 187.491 97.11L187.501 97.1Z"
        stroke="currentColor"
        strokeWidth="15"
      />
      <path
        d="M75 190C81.55 207.48 99.22 220 120 220C140.78 220 158.45 207.48 165 190"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="30.2927"
        y1="30.7344"
        x2="210.266"
        y2="210.708"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="30.8995"
        y1="31"
        x2="210"
        y2="210.101"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 알림 켬 (벨 채움) - currentColor 상속 */
export function NotificationOnIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M187.501 97.1V90.05C187.501 51.36 157.261 20 120.001 20C82.7406 20 52.5006 51.36 52.5006 90.05V97.1C52.5127 105.516 50.1111 113.758 45.5806 120.85L34.5006 138.1C24.3906 153.85 32.1106 175.26 49.7006 180.24C95.6635 193.257 144.338 193.257 190.301 180.24C207.891 175.26 215.611 153.85 205.501 138.11L194.421 120.86C189.887 113.769 187.482 105.527 187.491 97.11L187.501 97.1Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="15"
      />
      <path
        d="M75 190C81.55 207.48 99.22 220 120 220C140.78 220 158.45 207.48 165 190"
        fill="currentColor"
      />
      <path
        d="M75 190C81.55 207.48 99.22 220 120 220C140.78 220 158.45 207.48 165 190"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
      />
    </svg>
  );
}
