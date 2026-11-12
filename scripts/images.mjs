#!/usr/bin/env node
/**
 * Source photos (Assets/img) -> optimized WebP in public/img/<name>-{1280,2400}.webp.
 * Map of source file -> public name lives below; add a line when a new photo arrives.
 *
 * Usage: npm run images
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'Assets', 'img');
const out = join(root, 'public', 'img');
mkdirSync(out, { recursive: true });

const MAP = {
  'Gemini_Generated_Image_ch90jich90jich90.jpeg': 'veiled',    // car under the sheet
  'Gemini_Generated_Image_d5luvjd5luvjd5lu.jpeg': 'profile',   // side profile, gold stripes
  'Gemini_Generated_Image_p34x8tp34x8tp34x.jpeg': 'night',     // tail lights under the stars
  'Gemini_Generated_Image_pnahs0pnahs0pnah.jpeg': 'drift',     // salt-flat drift under the moon
  'vanta-hero.jpg': 'rear',                                    // rear three-quarter, wet floor
};

for (const [file, name] of Object.entries(MAP)) {
  const p = join(src, file);
  if (!existsSync(p)) { console.warn('missing', file); continue; }
  for (const w of [1280, 2400]) {
    const dest = join(out, `${name}-${w}.webp`);
    const info = await sharp(p).resize({ width: w, withoutEnlargement: true }).webp({ quality: w > 2000 ? 80 : 78 }).toFile(dest);
    console.log(`${name}-${w}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
