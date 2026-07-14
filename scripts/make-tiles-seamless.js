/**
 * Make theme tiles seamlessly tileable (wrap left↔right and top↔bottom).
 * Uses half-offset + soft cross-seam heal + restore — standard texture trick.
 *
 * Usage: node scripts/make-tiles-seamless.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(__dirname, '..', 'assets', 'backgrounds');
const BLEND = 56; // px — wide enough to hide the diamond joints

function roll(src, w, h, ox, oy) {
  const out = Buffer.alloc(src.length);
  for (let y = 0; y < h; y++) {
    const sy = (y + oy + h * 8) % h;
    for (let x = 0; x < w; x++) {
      const sx = (x + ox + w * 8) % w;
      const si = (w * sy + sx) << 2;
      const di = (w * y + x) << 2;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = 255;
    }
  }
  return out;
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function get(data, w, x, y) {
  const i = (w * y + x) << 2;
  return [data[i], data[i + 1], data[i + 2]];
}

function set(data, w, x, y, rgb) {
  const i = (w * y + x) << 2;
  data[i] = rgb[0];
  data[i + 1] = rgb[1];
  data[i + 2] = rgb[2];
  data[i + 3] = 255;
}

function lerp3(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Soft-blend a vertical seam at cx so left/right wrap matches. */
function blendVertical(data, w, h, cx, blend) {
  const out = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    const left = get(data, w, Math.max(0, cx - blend), y);
    const right = get(data, w, Math.min(w - 1, cx + blend), y);
    for (let dx = -blend; dx <= blend; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= w) continue;
      const t = smoothstep((dx + blend) / (2 * blend));
      const ramp = lerp3(left, right, t);
      // Keep texture near strip edges; replace near the hard seam.
      const mask = Math.sin(((dx + blend) / (2 * blend)) * Math.PI); // 0..1..0
      const cur = get(data, w, x, y);
      // Also mirror-mix with the opposite side of the seam for continuity.
      const mirror = get(data, w, Math.max(0, Math.min(w - 1, cx - dx)), y);
      const mirrored = lerp3(cur, mirror, mask * 0.45);
      set(out, w, x, y, lerp3(mirrored, ramp, mask * 0.55));
    }
  }
  return out;
}

/** Soft-blend a horizontal seam at cy so top/bottom wrap matches. */
function blendHorizontal(data, w, h, cy, blend) {
  const out = Buffer.from(data);
  for (let x = 0; x < w; x++) {
    const top = get(data, w, x, Math.max(0, cy - blend));
    const bot = get(data, w, x, Math.min(h - 1, cy + blend));
    for (let dy = -blend; dy <= blend; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= h) continue;
      const t = smoothstep((dy + blend) / (2 * blend));
      const ramp = lerp3(top, bot, t);
      const mask = Math.sin(((dy + blend) / (2 * blend)) * Math.PI);
      const cur = get(data, w, x, y);
      const mirror = get(data, w, x, Math.max(0, Math.min(h - 1, cy - dy)));
      const mirrored = lerp3(cur, mirror, mask * 0.45);
      set(out, w, x, y, lerp3(mirrored, ramp, mask * 0.55));
    }
  }
  return out;
}

/** Force fully opaque + lightly match opposite edges for residual hairlines. */
function finalizeEdges(data, w, h, band = 2) {
  const out = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < band; x++) {
      const a = get(data, w, x, y);
      const b = get(data, w, w - 1 - x, y);
      const m = lerp3(a, b, 0.5);
      set(out, w, x, y, lerp3(a, m, 0.65));
      set(out, w, w - 1 - x, y, lerp3(b, m, 0.65));
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < band; y++) {
      const a = get(out, w, x, y);
      const b = get(out, w, x, h - 1 - y);
      const m = lerp3(a, b, 0.5);
      set(out, w, x, y, lerp3(a, m, 0.65));
      set(out, w, x, h - 1 - y, lerp3(b, m, 0.65));
    }
  }
  return out;
}

function makeSeamless(file) {
  const src = PNG.sync.read(fs.readFileSync(file));
  const w = src.width;
  const h = src.height;
  const ox = Math.floor(w / 2);
  const oy = Math.floor(h / 2);
  const blend = Math.min(BLEND, Math.floor(Math.min(w, h) / 4));

  let data = Buffer.from(src.data);
  // Ensure opaque
  for (let i = 3; i < data.length; i += 4) data[i] = 255;

  // Move seams to center → heal → move back
  data = roll(data, w, h, ox, oy);
  data = blendVertical(data, w, h, ox, blend);
  data = blendHorizontal(data, w, h, oy, blend);
  // Heal the center cross intersection a second time (narrower)
  data = blendVertical(data, w, h, ox, Math.floor(blend * 0.55));
  data = blendHorizontal(data, w, h, oy, Math.floor(blend * 0.55));
  data = roll(data, w, h, ox, oy);
  data = finalizeEdges(data, w, h, 3);

  src.data = data;
  fs.writeFileSync(file, PNG.sync.write(src, { colorType: 6 }));

  // Edge continuity score after fix
  let de = 0;
  for (let y = 0; y < h; y++) {
    const a = get(data, w, 0, y);
    const b = get(data, w, w - 1, y);
    de += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  }
  let de2 = 0;
  for (let x = 0; x < w; x++) {
    const a = get(data, w, x, 0);
    const b = get(data, w, x, h - 1);
    de2 += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  }
  console.log(
    path.basename(file),
    `${w}x${h}`,
    `blend=${blend}`,
    `LRdelta=${(de / h).toFixed(2)}`,
    `TBdelta=${(de2 / w).toFixed(2)}`,
  );
}

function writePreview(name) {
  const src = PNG.sync.read(fs.readFileSync(path.join(DIR, `${name}-tile.png`)));
  const w = src.width;
  const h = src.height;
  const out = new PNG({ width: w * 2, height: h * 2 });
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const si = (w * y + x) << 2;
          const di = (out.width * (ty * h + y) + (tx * w + x)) << 2;
          out.data[di] = src.data[si];
          out.data[di + 1] = src.data[si + 1];
          out.data[di + 2] = src.data[si + 2];
          out.data[di + 3] = 255;
        }
      }
    }
  }
  const pred = path.join(DIR, `_${name}-2x2-preview.png`);
  fs.writeFileSync(pred, PNG.sync.write(out, { colorType: 6 }));
}

// Backup originals once, then make seamless from the working tile files.
for (const name of ['sea', 'grass', 'desert']) {
  const file = path.join(DIR, `${name}-tile.png`);
  const bak = path.join(DIR, `${name}-tile.source.png`);
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
    console.log('backed up', path.basename(bak));
  } else {
    // Always regenerate from the pristine source so re-runs stay stable.
    fs.copyFileSync(bak, file);
  }
  makeSeamless(file);
  writePreview(name);
}

console.log('done — check assets/backgrounds/_*2x2-preview.png');
