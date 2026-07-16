/**
 * Rasterize the theme SVG scenes to high-res PNGs so they can be used with the
 * standard React Native Image pipeline (no react-native-svg native module).
 *
 * Rendered at 2x the viewBox (4800x3000) — far more than any phone needs, so the
 * scene is always downscaled (crisp) when displayed.
 *
 * Usage: node scripts/rasterize-backgrounds.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIR = path.join(__dirname, '..', 'assets', 'backgrounds');
const THEMES = ['sea', 'desert', 'grass'];
const VIEW_W = 2400;
const VIEW_H = 1500;
const SCALE = 2;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: VIEW_W, height: VIEW_H },
    deviceScaleFactor: SCALE,
  });

  for (const theme of THEMES) {
    const svg = fs.readFileSync(path.join(DIR, `${theme}.svg`), 'utf8');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{margin:0;padding:0}
      svg{display:block;width:${VIEW_W}px;height:${VIEW_H}px}
    </style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: 'networkidle' });
    const out = path.join(DIR, `${theme}-scene.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: VIEW_W, height: VIEW_H } });
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${theme}-scene.png ${VIEW_W * SCALE}x${VIEW_H * SCALE} (${kb}kb)`);
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
