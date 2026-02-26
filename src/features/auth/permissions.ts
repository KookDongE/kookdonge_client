import type { UserProfileRes } from '@/types/api';

/**
 * 스웨거 기준 권한:
 * - GET /api/users/me → managedClubIds: 동아리장/임원인 동아리 ID 목록 (리더 권한)
 * - role: 스웨거 스키마에는 없으나, 백엔드가 시스템 관리자 구분을 위해 'ADMIN'을 줄 수 있음
 */

/** 시스템 관리자(ADMIN) 여부. 관리자 페이지·하단 탭·동아리 카드 스와이프(숨기기/삭제)에 사용 */
export function isSystemAdmin(profile: UserProfileRes | null | undefined): boolean {
  if (!profile) return false;
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
