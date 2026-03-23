/**
 * 빌드 시 PWA 캐시 무효화용 버전 파일 생성.
 * prebuild에서 실행되며, 매 빌드마다 새 버전으로 아이콘/manifest URL이 갱신됩니다.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Node.js 빌드 스크립트는 CommonJS 사용 */
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', '.pwa-version.json');
const version = Date.now().toString();
fs.writeFileSync(outPath, JSON.stringify({ version }, null, 2) + '\n', 'utf-8');
