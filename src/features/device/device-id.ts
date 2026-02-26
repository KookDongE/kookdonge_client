const DEVICE_ID_KEY = 'kookdonge-device-id';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
}

/** localStorage에 저장된 기기 ID를 반환하고, 없으면 생성해 저장 후 반환 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
