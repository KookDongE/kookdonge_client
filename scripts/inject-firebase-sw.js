/**
 * 빌드 시 .env의 NEXT_PUBLIC_FIREBASE_* 값을 public/firebase-messaging-sw.js에 주입.
 * 사용: node scripts/inject-firebase-sw.js
 * (next build 전에 실행하거나 package.json "prebuild"에 추가)
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Node.js 빌드 스크립트는 CommonJS 사용 */
const fs = require('fs');
const path = require('path');

const env = process.env;
const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

const swPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
let content = fs.readFileSync(swPath, 'utf8');
content = content.replace(
  /var firebaseConfig = \{[\s\S]*?\};/,
  `var firebaseConfig = ${JSON.stringify(config, null, 2)};`
);
fs.writeFileSync(swPath, content);
console.log('[inject-firebase-sw] Updated firebase-messaging-sw.js with env config');
