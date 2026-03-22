'use client';

const NOTIFICATION_INLINE_PROMPT_SEEN_KEY = 'kookdonge-notification-inline-prompt-seen';

function getSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(NOTIFICATION_INLINE_PROMPT_SEEN_KEY) === 'true';
  } catch {
    return true;
  }
}

function setSeen(): void {
  try {
    localStorage.setItem(NOTIFICATION_INLINE_PROMPT_SEEN_KEY, 'true');
  } catch {
    // ignore
  }
}

export function getNotificationInlinePromptSeen(): boolean {
  return getSeen();
}

export function setNotificationInlinePromptSeen(): void {
  setSeen();
}

type NotificationPermissionInlineModalProps = {
  open: boolean;
  onClose: () => void;
  onAllow: () => void | Promise<void>;
  isAllowLoading?: boolean;
};

export function NotificationPermissionInlineModal({
  open,
  onClose,
  onAllow,
  isAllowLoading = false,
}: NotificationPermissionInlineModalProps) {
  const handleLater = () => {
    setSeen();
    onClose();
  };

  const handleAllow = async () => {
    await onAllow();
    setSeen();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={handleLater} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-inline-modal-title"
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-zinc-800"
      >
        <h2
          id="notification-inline-modal-title"
          className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100"
        >
          알림을 켜시겠어요?
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          모집 시작·답변 알림 등 소식을 놓치지 않도록 알림 권한을 허용해 주세요.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLater}
            className="flex-1 rounded-xl border border-zinc-200 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={() => handleAllow()}
            disabled={isAllowLoading}
            className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-lime-400 dark:text-zinc-900 dark:hover:bg-lime-300"
          >
            {isAllowLoading ? '처리 중…' : '알림 켜기'}
          </button>
        </div>
      </div>
    </div>
  );
}
