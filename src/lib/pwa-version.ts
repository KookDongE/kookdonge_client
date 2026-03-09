import fs from 'fs';
import path from 'path';

const PWA_VERSION_FILE = '.pwa-version.json';

/**
 * PWA manifest/아이콘 캐시 무효화용 버전.
 * 우선순위: .pwa-version.json(빌드 시 자동 생성) > NEXT_PUBLIC_APP_VERSION > package.json version
 */
export function getPwaVersion(): string {
  if (typeof process === 'undefined') return '1.0.0';
  const cwd = process.cwd();
  try {
    const buildVersionPath = path.join(cwd, PWA_VERSION_FILE);
    if (fs.existsSync(buildVersionPath)) {
      const data = JSON.parse(fs.readFileSync(buildVersionPath, 'utf-8')) as { version?: string };
      if (data?.version) return data.version;
    }
  } catch {
    // ignore
  }
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }
  try {
    const pkgPath = path.join(cwd, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string };
    return pkg?.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}
