export { authApi } from './api';
export {
  authKeys,
  useLogin,
  useMyProfile,
  useRegister,
  useReissueToken,
  useUpdateProfile,
} from './hooks';
export { isClubManager, isSystemAdmin } from './permissions';
export { AuthProvider } from './provider';
export { useAuthStore } from './store';

export {
  buildLoginUrl,
  consumePostLoginRedirect,
  getReturnUrlFromSearchParam,
  hrefToReturnPath,
  requiresAuthForPath,
  requiresAuthForHref,
  sanitizeInternalPath,
  setPostLoginRedirect,
} from '@/lib/constants/auth-routes';

export { useLoginRequiredModalStore } from './login-required-modal-store';
