#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
// Jimp is ESM in latest versions; load dynamically for CJS compatibility
let JimpMod = null;
async function ensureJimp() {
  if (!JimpMod) {
    const mod = await import('jimp');
    JimpMod = mod.default || mod.Jimp || mod;
  }
  return JimpMod;
}

const SRC = path.resolve(__dirname, '../assets/images/logo.png');
const OUT_DIR = path.resolve(__dirname, '../assets/images');

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function makeSquareIcon({ out, canvasSize, innerMax, bg = 0x00000000 }) {
  const Jimp = await ensureJimp();
  const src = await Jimp.read(SRC);
  const canvas = new Jimp({ width: canvasSize, height: canvasSize, color: bg });
  const scale = Math.min(innerMax / src.bitmap.width, innerMax / src.bitmap.height, 1);
  const w = Math.max(1, Math.round(src.bitmap.width * scale));
  const h = Math.max(1, Math.round(src.bitmap.height * scale));
  // Jimp v0.22+ resize signature expects an options object
  src.resize({ w, h, mode: 'bicubic' });
  const x = Math.round((canvasSize - w) / 2);
  const y = Math.round((canvasSize - h) / 2);
  canvas.composite(src, x, y);
  await canvas.writeAsync(out);
  console.log('Generated', out);
}

(async () => {
  try {
    await ensureDir(OUT_DIR);

    // 1) App icon: 1024x1024, full area
    await makeSquareIcon({
      out: path.join(OUT_DIR, 'icon.png'),
      canvasSize: 1024,
      innerMax: 1024,
    });

    // 2) Adaptive icon: 1024x1024, with padding (safe zone ~80%)
    await makeSquareIcon({
      out: path.join(OUT_DIR, 'adaptive-icon.png'),
      canvasSize: 1024,
      innerMax: Math.round(1024 * 0.8),
    });

    // 3) Favicon: 512x512
    await makeSquareIcon({
      out: path.join(OUT_DIR, 'favicon.png'),
      canvasSize: 512,
      innerMax: 512,
    });

    // 4) Splash icon: 1024x1024 (plugin will size at runtime via imageWidth)
    await makeSquareIcon({
      out: path.join(OUT_DIR, 'splash-icon.png'),
      canvasSize: 1024,
      innerMax: Math.round(1024 * 0.7),
    });
  } catch (e) {
    console.error('Asset generation failed:', e);
    process.exit(1);
  }
})();