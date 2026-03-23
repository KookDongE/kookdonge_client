/**
 * 앱 아이콘 PNG에 둥근 모서리 마스크 적용 (바깥은 투명).
 * 실행: node scripts/round-app-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const FILES = [
  'public/icons/icon-light-192.png',
  'public/icons/icon-light-512.png',
  'public/icons/icon-dark-192.png',
  'public/icons/icon-dark-512.png',
  'public/icons/icon-192.png',
  'src/app/icon.png',
];

/** 짧은 변 대비 반지름 비율 (크면 더 둥근 스쿼클 느낌, 탭 축소 시에도 보임) */
const RADIUS_RATIO = 0.26;

async function roundIcon(relativePath) {
  const inputPath = path.join(root, relativePath);
  if (!fs.existsSync(inputPath)) {
    console.warn('skip (missing):', relativePath);
    return;
  }

  const buf = await fs.promises.readFile(inputPath);
  const meta = await sharp(buf).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) throw new Error(`no size: ${relativePath}`);

  const r = Math.round(Math.min(w, h) * RADIUS_RATIO);

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/>
    </svg>`
  );

  await sharp(buf)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(inputPath);

  console.log('rounded:', relativePath);
}

for (const f of FILES) {
  await roundIcon(f);
}
