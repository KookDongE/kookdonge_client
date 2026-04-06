import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 프로덕션에서 http 요청을 https로 통일합니다.
 * 링크 미리보기(카카오 등)가 http URL로 들어와도 동일한 OG 메타를 받도록 합니다.
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const host = request.headers.get('host') ?? '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return NextResponse.next();
  }

  const proto = request.headers.get('x-forwarded-proto');
  if (proto === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
