/**
 * 빌드 시 .env의 NEXT_PUBLIC_FIREBASE_* 값을 public/firebase-messaging-sw.js에 주입.
 * 사용: node scripts/inject-firebase-sw.js
 * (npm run build 시 prebuild로 자동 실행됨)
 * .env.local / .env 파일을 읽어 process.env에 병합 (로컬 빌드 시 필요)
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Node.js 빌드 스크립트는 CommonJS 사용 */
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
const placeholderConfig = `var firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};`;

if (process.argv.includes('--restore')) {
  let c = fs.readFileSync(swPath, 'utf8');
  c = c.replace(/var firebaseConfig = \{[\s\S]*?\};/, placeholderConfig);
  fs.writeFileSync(swPath, c);
  console.log('[inject-firebase-sw] Restored placeholders in firebase-messaging-sw.js');
  process.exit(0);
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        )
          value = value.slice(1, -1).replace(/\\n/g, '\n');
        env[key] = value;
      }
    });
    return env;
  } catch {
    return {};
  }
}

const rootDir = path.join(__dirname, '..');
const envLocal = loadEnvFile(path.join(rootDir, '.env.local'));
const envDefault = loadEnvFile(path.join(rootDir, '.env'));
const env = { ...envDefault, ...envLocal, ...process.env };
const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

let content = fs.readFileSync(swPath, 'utf8');
content = content.replace(
  /var firebaseConfig = \{[\s\S]*?\};/,
  `var firebaseConfig = ${JSON.stringify(config, null, 2)};`
);
fs.writeFileSync(swPath, content);
console.log('[inject-firebase-sw] Updated firebase-messaging-sw.js with env config');
