'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Spring Security 기본 리다이렉트 URI: /login/oauth2/code/google
 * Google이 이 경로로 콜백하면 쿼리(code, state 등)를 유지한 채 /callback으로 보내 기존 로직에서 처리.
 */
function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/callback?${qs}` : '/callback');
  }, [router, searchParams]);

  return null;
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
