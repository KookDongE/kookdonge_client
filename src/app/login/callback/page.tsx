'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/callback?${qs}` : '/callback');
  }, [router, searchParams]);

  return null;
}

/** Google OAuth 콜백은 /callback 로 통일. 기존 /login/callback 접속 시 쿼리 유지하며 리다이렉트 */
export default function LoginCallbackRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
