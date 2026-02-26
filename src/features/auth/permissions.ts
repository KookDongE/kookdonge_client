import type { UserProfileRes } from '@/types/api';

/**
 * GET /api/users/me 기준 (스웨거 UserProfileRes):
 * - isAdmin: 관리자 여부 (우선 사용)
 * - role / roles: 레거시 fallback. snake_case is_admin 응답도 fallback 지원
 */

/** 시스템 관리자(ADMIN) 여부. 관리자 페이지·하단 탭·동아리 카드 스와이프(숨기기/삭제)에 사용 */
export function isSystemAdmin(profile: UserProfileRes | null | undefined): boolean {
  if (!profile) return false;
  if (profile.isAdmin === true) return true;
  const p = profile as { is_admin?: boolean };
  if (p.is_admin === true) return true;
  const role = (profile as { role?: string; roles?: string[] }).role;
  const roles = (profile as { role?: string; roles?: string[] }).roles;
  const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
  const hasAdminRole = roleUpper === 'ADMIN';
  const hasAdminInRoles = Array.isArray(roles) && roles.some((r) => String(r).toUpperCase() === 'ADMIN');
  return hasAdminRole || hasAdminInRoles;
}

/** 해당 동아리에 대한 관리 권한(동아리장/임원) 여부. managedClubIds에 포함되면 true */
export function isClubManager(
  profile: UserProfileRes | null | undefined,
  clubId: number
): boolean {
  return Boolean(profile?.managedClubIds?.includes(clubId));
}
