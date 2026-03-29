'use client';

import type { ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';

import { hrefToReturnPath, requiresAuthForHref } from '@/lib/constants/auth-routes';
import { useAuthStore } from '@/features/auth/store';
import { useLoginRequiredModalStore } from '@/features/auth/login-required-modal-store';

type AuthAwareLinkProps = LinkProps & {
  children?: ReactNode;
  className?: string;
};

/**
 * 게스트가 로그인 필수 경로로 이동하려 할 때 네비게이션을 막고 로그인 필요 모달을 띄웁니다.
 */
export function AuthAwareLink({ href, onClick, children, ...rest }: AuthAwareLinkProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const openLoginModal = useLoginRequiredModalStore((s) => s.open);

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!accessToken && requiresAuthForHref(href)) {
          e.preventDefault();
          openLoginModal(hrefToReturnPath(href));
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
